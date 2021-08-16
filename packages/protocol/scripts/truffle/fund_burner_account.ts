import { Connection } from '@celo/connect'
import { LocalWallet } from '@celo/wallet-local'
import Web3 from 'web3'

/*
 * A script that funds a burner account used to deploy release contracts with CELO on a given network
 *
 *
 * Run using truffle exec, e.g.:
 * truffle exec scripts/truffle/fund_burner_accounts \
 *   --network alfajores --key 0x0000000000000000000000000000000000000000000000000000000000000000
 *   --amount 1000000000000000000
 */

module.exports = async (callback: (error?: any) => number) => {
  try {
    const argv = require('minimist')(process.argv.slice(2), {
      string: ['key', 'amount'],
    })

    const web: Web3 = new Web3('http://127.0.0.1:8545')

    // web3.eth.accounts.privateKeyToAccount(
    //   '0x3262cbe4bdd55a27ba11ca4674fc91afe0539f850f3074dc06928c5bf9a0e10d'
    // )

    var burnerAddress: string

    const connection = new Connection(web, new LocalWallet())

    connection.addAccount(argv.key)

    // connection.getBalance('0x7F871c887e6a430D3c1F434737F568B07559F9E7').then(console.log)

    // connection.getAccounts().then((e) => (connection.defaultAccount = e[0]))

    // connection.getAccounts().then(console.log)
    // connection.getAccounts()

    // var burnerAddress: string = await
    // connection.getAccounts().then(function (e) {
    //   const burnerAddress = e[0]
    // })

    const prom = await connection.getAccounts()
    var burnerAddress: string = prom[0]

    await web.eth.personal.unlockAccount(burnerAddress, 'A', 600)

    // connection.getAccounts().then(console.log)

    // await sendTransactionWithPrivateKey(
    //   web3,
    //   null,
    //   '0x3262cbe4bdd55a27ba11ca4674fc91afe0539f850f3074dc06928c5bf9a0e10d',
    //   { to: burnerAddress, amount: '1000000000000000000' }
    // )

    var amount: string = '1000000000000000000'

    if (argv.amount) {
      amount = argv.amount
    }

    await connection.sendTransaction({
      from: '0x7F871c887e6a430D3c1F434737F568B07559F9E7',
      to: burnerAddress,
      value: amount,
    })

    web.eth.personal.defaultAccount = burnerAddress
    web.eth.defaultAccount = burnerAddress
    argv.from = burnerAddress

    connection.getBalance(burnerAddress).then(console.log)

    // connection.getAccounts().then(console.log)

    // connection.defaultAccount = '0x7F871c887e6a430D3c1F434737F568B07559F9E7'
    callback()
  } catch (error) {
    callback(error)
  }
}
