
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

class Account {
    constructor() {
        this.num = Math.floor(Math.random() * Math.floor(100))
        this.bal = 100 * Dollar
    }
    Balance() {
        BalanceCallback(this.num, this.bal)
    }
    Add(amt) {
        if (this.bal + amt < 0) {
            ErrCallback(`Insuff. funds $${this.bal / Dollar} for w/d $${-amt / Dollar}`)
        } else {
            this.bal += amt
        }
    }
    TransferTo(to, amt) {
        if (amt < 0) {
            to.TransferTo(this, -amt)
        } else if (amt > this.bal) {
            ErrCallback(`Insuff. funds $${this.bal / Dollar} for w/d $${amt / Dollar}`)
        } else {
            this.bal -= amt
            to.Add(amt)
        }
    }
}

function main() {
    console.time('Execution time')

    ac1 = new Account()
    ac2 = new Account()

    ac1.Balance()
    ac2.Balance()

    ac1.Add(1000 * Dollar)
    ac2.Add(500 * Dollar)
    ac1.Add(200 * Dollar)
    ac1.Add(-1e6 * Dollar)

    ac1.TransferTo(ac2, 500 * Dollar)

    ac1.Balance()
    ac2.Balance()

    for (let i = 0; i < 5000; i++) {
        ac1.Add(1000 * Dollar)
        ac2.Add(500 * Dollar)
        ac1.TransferTo(ac2, 250 * Dollar)
        ac2.TransferTo(ac1, 100 * Dollar)
    }

    ac1.Balance()
    ac2.Balance()

    console.timeEnd('Execution time')
}

main()
