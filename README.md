**PROXY**

For project you must to have downloaded node.js and mongoDB on your local machine.

Manual:
1. In root directory of project run **npm install**;
2. Then in same directory run **node switch.js** for running switch server;
3. Open a different terminal and go to one of the directories: *sideA* or *sideB*;
4. Run **node controller.js** for init first client on switch server;
5. In *switch.js* terminal you will see availables addresses, copy one of them.
6. Open a different terminal and go to another directory: *sideA* or *sideB*, depend on your prevent choose;
7. Run **node controller.js < past id >**. You will see message exchange between the controller and the chosen device.


