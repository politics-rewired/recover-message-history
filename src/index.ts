import twilio from 'twilio';
import papaparse from 'papaparse';
import fs from 'fs';

// const NOW = new Date();

async function main(): Promise<void> {
  const instance = twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

  const searchAfter = new Date('2020-01-31 20:00:00+00');
  const searchBefore = new Date('2020-02-01 00:30:00+00');

  const messages = await instance.messages.list({
    dateSentAfter: searchAfter,
    dateSentBefore: searchBefore
  });

  const rows = messages
    .filter(m => m.direction === 'inbound')
    .map(m => {
      return {
        contact_number: m.direction === 'inbound' ? m.from : m.to,
        created_at: m.dateCreated,
        is_from_contact: m.direction === 'inbound',
        num_media: m.numMedia,
        num_segments: m.numSegments,
        send_status: m.status,
        sent_at: m.dateSent,
        service_id: m.direction === 'inbound' ? m.messagingServiceSid : m.sid,
        service_response_at: m.dateUpdated,
        text: m.body,
        updated_at: m.dateUpdated
      };
    });

  const output = papaparse.unparse(rows);
  fs.writeFileSync('./messages.csv', output);
}

main()
  .then(console.log)
  .catch(console.error);
