package main

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)

type Cent int64

type Account struct {
	num      int
	bal      Cent
	pub, pri chan<- func()
	wg       *sync.WaitGroup
}

const Dollar Cent = 100

func ErrCallback(err error) {
	if err != nil {
		fmt.Println(err)
	}
}

func BalanceCallback(num int, bal Cent) {
	fmt.Printf("Account %d, Balance: $%v\n", num, bal/Dollar)
}

func WaitForAll(ac1, ac2 *Account) {
	time.Sleep(1 * time.Millisecond)
	ac1.wg.Wait()
	ac2.wg.Wait()
	ac1.wg.Wait()
}

func NewAccount() *Account {
	pub := make(chan func())
	pri := make(chan func())
	wg := &sync.WaitGroup{}
	go func() {
		for {
			select {
			case f := <-pri:
				f()
			case f := <-pub:
				f()
			}
		}
	}()
	return &Account{
		num: rand.Intn(100),
		bal: 100 * Dollar,
		pub: pub,
		pri: pri,
		wg:  wg,
	}
}

func (ac *Account) Add(amt Cent) {
	ac.wg.Add(1)
	ac.pub <- func() {
		defer ac.wg.Done()
		if ac.bal+amt < 0 {
			ErrCallback(fmt.Errorf("Insuff. funds $%v for w/d $%v",
				ac.bal/Dollar, -amt/Dollar))
		} else {
			ac.bal += amt
		}
	}
}

func (ac *Account) Balance() {
	ac.wg.Add(1)
	ac.pub <- func() {
		defer ac.wg.Done()
		BalanceCallback(ac.num, ac.bal)
	}
}

func (ac *Account) TransferTo(to *Account, amt Cent) {
	ac.wg.Add(1)
	ac.pri <- func() {
		defer ac.wg.Done()
		if amt < 0 {
			go to.TransferTo(ac, -amt)
		} else if amt > ac.bal {
			ErrCallback(fmt.Errorf("Insuff. funds $%v for w/d $%v", ac.bal/Dollar, amt/Dollar))
		} else {
			ac.bal -= amt
			go to.Add(amt)
		}
	}
}

func main() {
	start := time.Now()

	ac1 := NewAccount()
	ac2 := NewAccount()

	ac1.Balance()
	ac2.Balance()

	WaitForAll(ac1, ac2)
	ac1.Add(1000 * Dollar)
	ac2.Add(500 * Dollar)
	ac1.Add(200 * Dollar)
	ac1.Add(-1e6 * Dollar)

	WaitForAll(ac1, ac2)
	ac1.TransferTo(ac2, 500*Dollar)

	WaitForAll(ac1, ac2)
	ac1.Balance()
	ac2.Balance()

	WaitForAll(ac1, ac2)
	for i := 0; i < 5000; i++ {
		ac1.Add(1000 * Dollar)
		ac2.Add(500 * Dollar)
		ac1.TransferTo(ac2, 250*Dollar)
		ac2.TransferTo(ac1, 100*Dollar)
	}

	WaitForAll(ac1, ac2)
	ac1.Balance()
	ac2.Balance()

	WaitForAll(ac1, ac2)

	end := time.Since(start)
	fmt.Printf("Execution time: %s", end)
}
