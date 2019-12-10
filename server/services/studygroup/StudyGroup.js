const App = require("../../lib/tcp/App");
const StudyGroups = require("./models/StudyGroups");
const { pushStudyGroups } = require("../../lib/redis");

class StudyGroup extends App {
  constructor(name, host, port) {
    super(name, host, port);
  }
  async onRead(socket, data) {
    const { params, curQuery } = data;

    this.tcpLogSender(curQuery);

    let replyData = data;

    switch (curQuery) {
      case "addGroup":
        try {
          const groupInfo = params;

          const result = await StudyGroups.create(groupInfo);
          await pushStudyGroups(result);

          replyData.method = "REPLY";
          replyData.body = { id: result.id };
        } catch (e) {
          console.error(e);
          replyData.method = "ERROR";
          replyData.body = e;
        }
        break;

      case "getGroupDetail":
        try {
          const { id } = params;
          const result = await StudyGroups.findById(id);

          replyData.method = "REPLY";
          replyData.body = result;
        } catch (e) {
          console.error(e);
          replyData.method = "ERROR";
          replyData.body = e;
        }
        break;

      case "removeGroup":
        try {
          const { id } = params;
          await StudyGroups.findByIdAndDelete(id);

          replyData.method = "REPLY";
          replyData.body = { status: 200 };
        } catch (e) {
          console.error(e);
          replyData.method = "ERROR";
          replyData.body = e;
        }

      default:
        break;
    }

    this.send(socket, replyData);
  }
}

module.exports = StudyGroup;
