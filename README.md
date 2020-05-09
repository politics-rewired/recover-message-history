# recover-message-history #
Recovering message history!

## How to install ##

**Prerequisite:** Nodejs

1. Clone repo
2. cd to `recover-message-history` in command line or terminal
3. run `npm install` or `yarn install`
4. Change the dates [here](https://github.com/politics-rewired/recover-message-history/blob/master/src/index.ts#L9) to the date ranges of messages in twilio that you'd like to recover
5. `ACCOUNT_SID=xxxx AUTH_TOKEN=xxxx npm run go` or `ACCOUNT_SID=xxxx AUTH_TOKEN=xxxx yarn run go`
    - `ACCOUNT_SID` is Twilio `API_KEY`, which should begin with `AC`
6. Output is a csv
