const fs = require('fs');

// todo forse cancellare il return
function getParagraphsFromFile(fileName) {
    return JSON.parse(fs.readFileSync(fileName)).map((p) => {
        return {
            paragraph: p,
            readingTime: 6000 * p.split(/\W+/).filter(token => token.length >= 2).length / 25
        }
    })
}


function getCommandCooldown(paragraphsObj) {
    // todo sistemare
    return paragraphsObj.reduce((accumulator, item, index) => ([0, paragraphsObj.length - 1].includes(index)) ? 0 : accumulator + item.readingTime, 0);
}

const vipUsers = ['motenay']

function isVIP(username) {
    return vipUsers.includes(username.toLowerCase());
}

exports.getCommandCooldown = getCommandCooldown;
exports.getParagraphsFromFile = getParagraphsFromFile;
exports.isVIP = isVIP;
