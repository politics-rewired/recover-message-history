import fs from 'fs';
import chunk from 'lodash/chunk';
import papaparse from 'papaparse';
import telnyx from 'telnyx';

const sleep = async ms =>
  new Promise(resolve => setTimeout(() => resolve(), ms));

const main = async () => {
  const filePath = process.argv[2];
  const file = fs.createReadStream(filePath);

  const { data, meta } = await new Promise((resolve, reject) => {
    papaparse.parse(file, {
      header: true,
      complete: function(results) {
        const { errors, meta, data } = results;
        // Ignore errors -- we know the CSV is malformed
        // if (errors) return reject(errors);
        resolve({ data, meta });
      }
    });
  });

  console.info(`Loaded CSV and parsed ${data.length} rows.`);

  let currentChunk = 0;
  let rows = [];
  const instance = telnyx(process.env.TELNYX_API_KEY);
  const allMdrs = data.map(datum => datum['Unique Mdr ID']);
  const mdrChunks = chunk(allMdrs, 40);
  console.info(
    `Mapped ${allMdrs.length} MDRs divided into ${mdrChunks.length} chunks.`
  );
  for (const mdrChunk of mdrChunks) {
    currentChunk += 1;
    console.log(`Processing chunk ${currentChunk} of ${mdrChunks.length}.`);

    const newRows = await Promise.all(
      mdrChunk.map(mdr =>
        instance
          .Message()
          .retrieve(mdr)
          .then(({ data }) => data)
          .then(payload => ({
            validated: true,
            body: payload.text,
            extra: JSON.stringify({ from_carrier: payload.from.carrier }),
            from: payload.from.phone_number,
            mediaUrls: payload.media.map(attachment => attachment.url),
            numMedia: payload.media.length,
            numSegments: payload.parts,
            receivedAt: payload.received_at,
            service: 'telnyx',
            serviceId: payload.id,
            to: payload.to
          }))
      )
    );
    rows = rows.concat(newRows);

    // Telnyx rate limiting
    await sleep(500);
  }

  console.info(`Ended up with ${rows.length} rows.`);

  const output = papaparse.unparse(rows);
  fs.writeFileSync('./telnyx-clean.csv', output);
};

main()
  .then(result => {
    console.log(result);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
