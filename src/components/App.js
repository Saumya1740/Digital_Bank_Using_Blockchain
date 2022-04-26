import { Tabs, Tab } from 'react-bootstrap'
import dBank from '../abis/dBank.json'
import Identicon from 'identicon.js';
import React, { Component } from 'react';
import Token from '../abis/Token.json'
import dbank from '../dbank.png';
import Web3 from 'web3';
import './App.css';

class App extends Component {

  async componentWillMount() {
    await this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    if (typeof window.ethereum !== 'undefined') {
      const web3 = new Web3(window.ethereum)
      const netId = await web3.eth.net.getId()
      const accounts = await web3.eth.getAccounts()

      // load balance
      if (typeof accounts[0] !== 'undefined') {
        const balance = await web3.eth.getBalance(accounts[0])
        this.setState({ account: accounts[0], balance: balance, web3: web3 })
      } else {
        window.alert('Please login with MetaMask')
      }

      //load contracts
      try {
        const token = new web3.eth.Contract(Token.abi, Token.networks[netId].address)
        const dbank = new web3.eth.Contract(dBank.abi, dBank.networks[netId].address)
        const dBankAddress = dBank.networks[netId].address
        // const dbank = new web3.eth.Contract(dBank.abi, accounts[0])
        // const dBankAddress = accounts[0]
        this.setState({ token: token, dbank: dbank, dBankAddress: dBankAddress })
      } catch (e) {
        console.log('Error', e)
        window.alert('Contracts not deployed to the current network')
      }

    } else {
      window.alert('Please install MetaMask')
    }
  }

  async deposit(amount) {
    if (this.state.dbank !== 'undefined') {
      try {
        await this.state.dbank.methods.deposit().send({ value: amount.toString(), from: this.state.account })
        // console.log(this.state.dbank.value)
      } catch (e) {
        console.log('Error, deposit: ', e)
      }
    }
  }

  async withdraw(e) {
    e.preventDefault()
    if (this.state.dbank !== 'undefined') {
      try {
        await this.state.dbank.methods.withdraw().send({ from: this.state.account })
      } catch (e) {
        console.log('Error, withdraw: ', e)
      }
    }
  }

  async borrow(amount) {
    if (this.state.dbank !== 'undefined') {
      try {
        await this.state.dbank.methods.borrow().send({ value: amount.toString(), from: this.state.account })
      } catch (e) {
        console.log('Error, borrow: ', e)
      }
    }
  }

  async payOff(e) {
    e.preventDefault()
    if (this.state.dbank !== 'undefined') {
      try {
        const collateralEther = await this.state.dbank.methods.collateralEther(this.state.account).call({ from: this.state.account })
        const tokenBorrowed = collateralEther / 2
        await this.state.token.methods.approve(this.state.dBankAddress, tokenBorrowed.toString()).send({ from: this.state.account })
        await this.state.dbank.methods.payOff().send({ from: this.state.account })
      } catch (e) {
        console.log('Error, pay off: ', e)
      }
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      web3: 'undefined',
      account: '',
      token: null,
      dbank: null,
      balance: 0,
      dBankAddress: null
    }
  }

  render() {
    return (
      <div className='text-monospace'>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <img src={dbank} className="App-logo" alt="logo" height="32" />
          <b class="text-warning">Digital Bank using Blockchain</b>
          <span>{this.state.account
            ? <img
              alt=""
              className='ml-2'
              width='30'
              height='30'
              src={`data:image/png;base64,${new Identicon(this.state.account, 30).toString()}`}
            />
            : <span></span>
          }
          </span>
        </nav>
        <div className="container-fluid mt-5 text-center">
          <br></br>
          <h1 className='p-3 mb-2 bg-info text-white'>Welcome to Digital Bank 🏦</h1>
          {/* <h3>Account Address:</h3> */}
          <h2 className='bg-warning text-dark'>Account Address: {this.state.account}</h2>
          <br></br>
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <Tabs defaultActiveKey="profile" id="uncontrolled-tab-example">
                  <Tab eventKey="deposit" title="Deposit">
                    <div>
                      <br></br>
                      How much do you want to deposit?
                      <br></br>
                      (min. amount is 0.01 ETH)
                      <br></br>
                      (1 deposit is possible at the time)
                      <br></br>
                      <form onSubmit={(e) => {
                        e.preventDefault()
                        let amount = this.depositAmount.value
                        amount = amount * 10 ** 18 //convert to wei
                        this.deposit(amount)
                
                      }}>
                        <div className='form-group mr-sm-2'>
                          <br></br>
                          <input
                            id='depositAmount'
                            step="0.01"
                            type='number'
                            ref={(input) => { this.depositAmount = input }}
                            className="form-control form-control-md"
                            placeholder='amount...'
                            required />
                        </div>
                        <button type='submit' className='btn btn-success'>DEPOSIT</button>
                        {/* <h3>Amount Deposited : {this.depositAmount}</h3> */}
                      </form>

                    </div>
                  </Tab>
                  <Tab eventKey="withdraw" title="Withdraw">
                    <br></br>
                    Do you want to withdraw + take interest?
                    <br></br>
                    <br></br>
                    <div>
                      <button type='submit' className='btn btn-danger' onClick={(e) => this.withdraw(e)}>WITHDRAW</button>
                    </div>
                  </Tab>
                  <Tab eventKey="borrow" title="Borrow">
                    <div>

                      <br></br>
                      Do you want to borrow tokens?
                      <br></br>
                      (You'll get 50% of collateral, in Tokens)
                      <br></br>
                      Type collateral amount (in ETH)
                      <br></br>
                      <br></br>
                      <form onSubmit={(e) => {

                        e.preventDefault()
                        let amount = this.borrowAmount.value
                        amount = amount * 10 ** 18 //convert to wei
                        this.borrow(amount)
                      }}>
                        <div className='form-group mr-sm-2'>
                          <input
                            id='borrowAmount'
                            step="0.01"
                            type='number'
                            ref={(input) => { this.borrowAmount = input }}
                            className="form-control form-control-md"
                            placeholder='amount...'
                            required />
                        </div>
                        <button type='submit' className='btn btn-info'>BORROW</button>
                      </form>
                    </div>
                  </Tab>
                  <Tab eventKey="payOff" title="Payoff">
                    <div>

                      <br></br>
                      Do you want to payoff the loan?
                      <br></br>
                      (You'll receive your collateral - fee)
                      <br></br>
                      <br></br>
                      <button type='submit' className='btn btn-primary' onClick={(e) => this.payOff(e)}>PAYOFF</button>
                    </div>
                  </Tab>
                </Tabs>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
