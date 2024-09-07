import msgpack from "msgpack-lite"
import ws from 'ws';
let teams = [];
let teammates = [];
export class Bot {
    constructor(region, token) {
        this.ws = new ws(`wss://${region}/?token=re:${token}`);
        this.sid = undefined;
        this.x = undefined;
        this.y = undefined;
        this.buildIndex = undefined;
        this.weaponIndex = undefined;
        this.team = undefined;
        this.skinIndex = undefined;
        this.tailIndex = undefined;
        this.health = 100;
        this.packetCount = 0;
        this.items = [0, 3, 6, 10];
        setInterval(() => { this.packetCount = 0; }, 1000);
        this.moveToTeammate = {
            x: undefined,
            y: undefined,
            boolean: false
        };

        this.ws.addEventListener('open', () => {
            console.log('websocket true');
            this.ws.addEventListener('message', event => {
                try {
                    let decoded = msgpack.decode(new Uint8Array(event.data));
                    let hooked;
                    if (decoded.length > 1 && Array.isArray(decoded[1])) {
                        hooked = [decoded[0], ...decoded[1]];
                    } else {
                        hooked = decoded;
                    }

                    if (hooked[0] === 'A') {
                        teams = hooked[1];
                        console.log(teams);
                    }

                    if (hooked[0] === 'C') {
                        if (this.sid == null) {
                            this.sid = hooked[1];
                        }
                    }

                    if (hooked[0] === 'a') {
                        teammates = [];
                        for (let i = 0; i < hooked[1].length / 13; i++) {
                            let playerInfo = hooked[1].slice(13 * i, 13 * i + 13);
                            if (playerInfo[0] == this.sid) {
                                this.x = playerInfo[1];
                                this.y = playerInfo[2];
                                this.buildIndex = playerInfo[4];
                                this.weaponIndex = playerInfo[5];
                                this.team = playerInfo[7];
                                this.skinIndex = playerInfo[9];
                                this.tailIndex = playerInfo[10];
                            } else if (playerInfo[7] == this.team && playerInfo[0] != this.sid) {
                                teammates.push({ sid: playerInfo[0], x: playerInfo[1], y: playerInfo[2] });
                            }
                        }
                        if (this.team != undefined) {
                            if (this.moveToTeammate.boolean) {
                                if (teammates.length > 0) {
                                    let { x, y } = teammates[0];
                                    let angle = Math.atan2(y - this.y, x - this.x);
                                    this.sendMessage('a', angle);
                                } else {
                                    let { x, y } = this.moveToTeammate;
                                    let angle = Math.atan2(y - this.y, x - this.x);
                                    this.sendMessage('a', angle);
                                }
                            }
                        }
                    }

                } catch (err) {
                    console.error('err:', err);
                }
            });
        });
    }

    async spawn(botname = 'BianosGoldBot', skin = 0) {
        this.sendMessage('M', {
            name: botname,
            moofoll: true,
            skin: skin
        });
    }

    async comeToTeammate() {
        this.moveToTeammate.boolean = !this.moveToTeammate.boolean;
    }

    async join(clan) {
        this.sendMessage('b', clan);
    }

    async equipIndex(buy, id, index) {
        this.sendMessage('c', buy, id, index);
    }

    async aimAt(angle) {
        this.sendMessage('D', angle);
    }

    async doHit(hitting, angle) {
        this.sendMessage('d', hitting, angle);
    }

    async selectBuild(index) {

    }

    async sendMessage(type, ...args) {
        if (this.ws.readyState === ws.OPEN && this.packetCount < 120) {
            let message = [type, args];
            let eM = msgpack.encode(message);
            let mes = new Uint8Array(eM);
            this.ws.send(mes);
            this.packetCount++;
        } else {
            return console.log('wait.');
        }
    }
}
