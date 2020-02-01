import twilio from 'twilio';
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';
import papaparse from 'papaparse';
import fs from 'fs';

async function main(): Promise<void> {
  const instance = twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

  const dateSentAfter = new Date('2020-01-31 15:00:00-05');
  const dateSentBefore = new Date('2020-01-31 21:30:00-05');

  const inboundMessages = await new Promise<MessageInstance[]>(
    (resolve, _reject) => {
      let count = 0;
      const result: MessageInstance[] = [];

      instance.messages.each({
        dateSentAfter,
        dateSentBefore,
        pageSize: 500,
        callback: (item, _done) => {
          count += 1;
          if (count % 1000 === 0) console.log(`Completed ${count}`);
          if (item.direction === 'inbound') {
            result.push(item);
          }
        },
        done: () => {
          console.log(
            `All done! Total count: ${count}. Inbound count: ${result.length}.`
          );
          resolve(result);
        }
      });
    }
  );

  const output = papaparse.unparse(inboundMessages);
  fs.writeFileSync('./messages.csv', output);
}

main()
  .then(result => {
    console.log(result);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
