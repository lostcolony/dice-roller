function initialize() {
    return `
    Commands: 
    \t/rollX to roll X d6s
    \t/frr to re-roll without risking success (if you have an ability to allow for that)
    \t/rr to re-roll risking a success (available if you have a success to wager)
    \t/allin to go all in and risk all successes (available if you have a success to wager and have already re-rolled successfully)
<br><br>
    `
}

const successLevels = ["basic", "critical", "extreme", "impossible", "jackpot"]

function parse(text, session) {
    let rollMatch = text.toString().match(/^\/roll(\d+)/)
    let rerollMatch = text.toString().match(/^\/rr/)
    let freeReRollMatch = text.toString().match(/^\/frr/)
    let allInMatch = text.toString().match(/^\/allin/)
    //If the user entered '/roll#'
    if(rollMatch) {
        //Grab the last arg which is the match group, #
        let num = rollMatch.pop();
        let numArr = []
        //For each die, roll a d6
        for(let i=0;i<parseInt(num);i++) {
            numArr.push(Math.floor(Math.random() * 6 + 1))
        } 
        let successes;
        [successes, unmatched] = dice_to_success_string(numArr)
        let successString = successes_to_string(successes)
        
        session.previous_roll = numArr
        session.successes = successes
        session.unmatched = unmatched
        return `<pre>  -> Rolled: (` + numArr.join(", ") + ");" + "<br>  -> Successes: " + successString  + `</pre>`
    } else if(rerollMatch) {
        let successString, successes; 
        [successes, unmatched, new_roll] = handle_reroll(session)
        let didBetter = true;
        if(unmatched.length == session.unmatched.length) {
            didBetter = false;
            for(let i=0;i<successLevels.length;i++) {
                let level = successLevels[i]
                if(successes[level]) {
                    successes[level] -= 1
                    break;
                }
            }
        }
        session.previous_roll = new_roll
        session.unmatched = unmatched
        successString = successes_to_string(successes) 
        return `<pre>  -> Re-rolled: (` + new_roll.join(", ") + `)<br>  -> ` + (didBetter ? "You rolled better" : "You lost a success") + `<br>  -> Successes: ` + successString + `</pre>`
    } else if(freeReRollMatch) {
        let successString, successes; 
        [successes, unmatched, new_roll] = handle_reroll(session)
        session.previous_roll = new_roll
        session.unmatched = unmatched
        successString = successes_to_string(successes) 
        return `<pre>  -> Re-rolled: (` + new_roll.join(", ") + `)<br>  ->` + " Successes: " + successString + `</pre>`
    } else if(allInMatch) {
        let successString, successes; 
        [successes, unmatched, new_roll] = handle_reroll(session)
        let didBetter = unmatched.length != session.unmatched.length
        if(!didBetter) {
            successes = successLevels.reduce((acc, x) => {
                acc[x] = 0
                return acc
            }, {})
        }
        session.previous_roll = new_roll
        session.unmatched = unmatched
        successString = successes_to_string(successes) 
        return `<pre>  -> Re-rolled: (` + new_roll.join(", ") + `)<br>  ->` + (didBetter ? ` You rolled better<br>  -> Successes: ` + successString  : " You lost all successes ") + `</pre>`
    }



    return ""
}

function handle_reroll(session) {
    let roll = session.previous_roll
    let unmatched = session.unmatched
    let new_roll = roll.map(x => {
        if(unmatched.indexOf(x) >= 0) {
            return Math.floor(Math.random() * 6 + 1)
        } else {
            return x
        }
    })
    return [...dice_to_success_string(new_roll), new_roll]
}


function dice_to_success_string(numArr) {
//Group the dice by their value, sort them by how many of the same number were rolled
        let grouped = Object.groupBy(numArr, (a) => a)
        
        
        let sortedKeys = Object.keys(grouped).sort((x, y) => y.length - x.length)

        //Initialize success counts, {"basic": 0, ...}
        let successes = successLevels.reduce((acc, x) => {
            acc[x] = 0
            return acc
        }, {})
        let unmatched = []
        //For every different die value we got
        for(let i=0;i<sortedKeys.length;i++) {
            let key = sortedKeys[i]
            let dice = grouped[key]
            //Append all the times we got that value to the output arr
            //Add the appropriate number of successes, with 1 being an unmatched instead 
            switch(dice.length) {
                case 1:
                    unmatched = unmatched.concat(dice)
                    break;
                case 2:
                    successes.basic += 1
                    break;
                case 3:
                    successes.critical += 1
                    break;
                case 4:
                    successes.extreme += 1
                    break;
                case 5:
                    successes.impossible += 1
                    break;
                case 6:
                    successes.jackpot += 1
                    break;
            }
        }

        
        return [successes, unmatched]

}

function successes_to_string(successes) {
    let returnString = [...successLevels].reverse().reduce((acc, level) => {
        if(successes[level]) {
            acc.push(successes[level].toString() + " " + level)
        }
        return acc
    }, []).join(", ")

    if (returnString == "") {
        returnString = "None"
    }
    return returnString
}

module.exports = {initialize, parse}

// console.log(parse("/roll10", {previous_roll: [4, 1, 4, 2, 5, 3, 6, 5, 4, 3], unmatched: [1,2,6]}))
// console.log(parse("/rr", {previous_roll: [1,2,1,2,3], unmatched: [3]}))
// console.log(parse("/allin", {previous_roll: [1,2,1,2,3], unmatched: [3]}))
// console.log(dice_to_success_string([2, 4, 3, 4, 4, 4, 4, 1, 4]))