-- NOTE: Before running this script, consider potential campaign
-- limits and default assignment ids

create schema recovery;

create table recovery.messages (
  contact_number text,
  created_at timestamp with time zone,
  is_from_contact boolean,
  num_media int,
  num_segments int,
  send_status text,
  sent_at timestamp with time zone,
  service_id text,
  service_response_at timestamp with time zone,
  text text,
  updated_at timestamp with time zone,
  user_id int
);

\copy recovery.messages from 'dfp-messages.csv' with csv header;

insert into message (
  user_id, contact_number, is_from_contact, text, service_response, assignment_id,
  service_id, send_status, created_at, sent_at, updated_at
)
select
  1, contact_number, is_from_contact, coalesce(text, ''), '', 4,
  service_id, UPPER(
    case
      when send_status = 'received' then 'delivered'
      when send_status = 'undelivered' then 'sent'
      when send_status = 'failed' then 'error'
      else send_status
    end
  ), sent_at, sent_at, updated_at
from recovery.messages;

update message
set campaign_contact_id = cc.id
from campaign_contact as cc
where message.contact_number = cc.cell;

with
  has_sent_message as (
    select id from campaign_contact
    where exists (
      select 1
      from message
      where campaign_contact_id = campaign_contact.id
    )
  ),
  has_received_message as (
    select id from campaign_contact
    where exists (
      select 1
      from message
      where campaign_contact_id = campaign_contact.id
        and is_from_contact = true
    )
  ),
  messaged_mark_result as (
    update campaign_contact
    set message_status = 'messaged'
    where id in ( select id from has_sent_message )
  )
  update campaign_contact
  set message_status = 'needsResponse', assignment_id = 4
  where id in ( select id from has_received_message );

