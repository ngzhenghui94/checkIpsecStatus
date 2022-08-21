import { spawn, exec } from "child_process";
import schedule from "node-schedule-tz";
import moment from "moment-timezone";
moment.tz.setDefault("Asia/Singapore");

const init = async () => {

    schedule.scheduleJob("*/1 * * * * ", async () => {
        console.log("@" + moment().format("DD MMMM YYYY HH:mm") + "Checking Tunnels.")
        //If no tunnel is active, up tunnel 1
        exec("ipsec status | grep 'Total IPsec connections: loaded 2, active 0'", (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}\n No Tunnel failure detected.`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            if (stdout.includes('Total IPsec connections: loaded 2, active 0')) {
                console.log("Detected no tunnel active, bring up Tunnel 1")
                exec("ipsec auto --up Tunnel1", (err, out, stderror) => {
                    if (err) {
                        console.log(`error: ${error.message}`);
                        return;
                    }
                    if (stderror) {
                        console.log(`stderr: ${stderr}`);
                        return;
                    }
                })
            } else {
                console.log("There is active tunnel")
            }
        });

        //if only 1 tunnel is loaded, up tunnel 2
        exec("ipsec status | grep 'Total IPsec connections: loaded 1, active 0'", (error, stdout, stderr) => {
            if (stdout.includes('Total IPsec connections: loaded 1, active 0')) {
                console.log("Tunnel 1 was down. Loaded Tunnel 2.")
                exec("ipsec auto --up Tunnel2")
            }
        });

        exec("ipsec status | grep 'loaded 0, active 0'", (error, stdout, stderr) => {
            if (stdout.includes('loaded 0, active 0')) {
                console.log("Tunnel 2 is down, reloading tunnel 1.")
                exec("ipsec auto --add Tunnel1")
                exec("ipsec auto --up Tunnel1")
                exec("ipsec auto --add Tunnel2")
            }
        });
    })
}
init();

