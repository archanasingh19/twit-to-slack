const { WebClient } = require("@slack/web-api");
const { createEventAdapter } = require("@slack/events-api");
const axios = require("axios");
const config = require("./config");

const slack_port = config.SLACK_PORT;
const slackToken = config.SLACK_TOKEN;
const slackSigningSecret = config.SIGHNING_SECRET;

const slackEvents = createEventAdapter(slackSigningSecret);
const slackClient = new WebClient(slackToken);
const port = slack_port || 3000;

const makeRequest = async (event) => {
  try {
    let word = event.text;
    word = word.split("<");
    const myword = word[0].trim();
    //Find your nationality based on your name
    const response = await axios.get(
      "https://api.nationalize.io/?name=" + myword
    );
    if (response.status === 200) {
      const iamfrom = response.data.country[0].country_id;
      (async () => {
        try {
          await slackClient.chat.postMessage({
            channel: event.channel,
            text:
              `Hello How are you <@${event.user}>! :tada:` +
              myword +
              ` is from ` +
              iamfrom,
          });
        } catch (error) {
          console.log(error.data);
        }
      })();
      return true;
    }
    return false;
  } catch (err) {
    console.error(err);
    return false;
  }
};

slackEvents.on("app_mention", (event) => {
  console.log(`Got message from user ${event.user}: ${event.text}`);
  makeRequest(event);
});

slackEvents.on("error", console.error);

slackEvents.start(port).then(() => {
  console.log(`Server started on port ${port}`);
});
