const Cent = 1
const Dollar = 100 * Cent

function ErrCallback(msg) {
    if (msg) {
        console.log(msg)
    }
}

function BalanceCallback(num, bal) {
    console.log(`Account ${num}, Balance: $${bal / Dollar}`)
}

const Delay = ms => new Promise(resolve => setTimeout(resolve, ms))

class WaitGroup {
    constructor() {
        this.total = 0
    }
    Add() {
        this.total++
    }
    Done() {
        this.total--
    }
    async Wait() {
        do {
            await Delay(1)
        }
        while (this.total !== 0)
    }
}

const WaitForAll = async (ac1, ac2) => {
    try {
        await Promise.all([
            await ac1.wg.Wait(),
            await ac2.wg.Wait(),
        ])
    } catch (e) {
        console.log('Error: ', e)
    }
}

class Account {
    constructor() {
        this.num = Math.floor(Math.random() * Math.floor(100))
        this.bal = 100 * Dollar
        this.pub = []
        this.pri = []
        this.wg = new WaitGroup()
        this.live = setInterval(() => {
            setTimeout(() => {
                this.runEach(this.pub)
            }, 0)
            setTimeout(() => {
                this.runEach(this.pri)
            }, 0)
        }, 1)

    }
    destructor() {
        clearInterval(this.live)
    }
    runEach(array) {
        if (array.length === 0) {
            return
        }
        const f = array.shift()
        f()
        this.runEach(array)
    }
    Balance() {
        this.wg.Add()
        this.pub.push(
            () => {
                BalanceCallback(this.num, this.bal)
                this.wg.Done()
            }
        )
    }
    Add(amt) {
        this.wg.Add()
        this.pub.push(
            () => {
                if (this.bal + amt < 0) {
                    ErrCallback(`Insuff. funds $${this.bal / Dollar} for w/d $${-amt / Dollar}`)
                } else {
                    this.bal += amt
                }
                this.wg.Done()
            }
        )
    }
    TransferTo(to, amt) {
        this.wg.Add()
        this.pri.push(
            () => {
                if (amt < 0) {
                    setTimeout(() => {
                        to.TransferTo(this, -amt)
                    }, 0)
                } else if (amt > this.bal) {
                    ErrCallback(`Insuff. funds $${this.bal / Dollar} for w/d $${amt / Dollar}`)
                } else {
                    this.bal -= amt
                    setTimeout(() => {
                        to.Add(amt)
                    }, 0)
                }
                this.wg.Done()
            }
        )
    }
}

async function main() {
    console.time('Execution time')

    ac1 = new Account()
    ac2 = new Account()

    ac1.Balance()
    ac2.Balance()

    await WaitForAll(ac1, ac2)
    ac1.Add(1000 * Dollar)
    ac2.Add(500 * Dollar)
    ac1.Add(200 * Dollar)
    ac1.Add(-1e6 * Dollar)

    await WaitForAll(ac1, ac2)
    ac1.TransferTo(ac2, 500 * Dollar)

    await WaitForAll(ac1, ac2)
    ac1.Balance()
    ac2.Balance()

    await WaitForAll(ac1, ac2)
    for (let i = 0; i < 5000; i++) {
        ac1.Add(1000 * Dollar)
        ac2.Add(500 * Dollar)
        ac1.TransferTo(ac2, 250 * Dollar)
        ac2.TransferTo(ac1, 100 * Dollar)
    }

    await WaitForAll(ac1, ac2)
    ac1.Balance()
    ac2.Balance()

    await WaitForAll(ac1, ac2)
    ac1.destructor()
    ac2.destructor()

    console.timeEnd('Execution time')
}

main()
