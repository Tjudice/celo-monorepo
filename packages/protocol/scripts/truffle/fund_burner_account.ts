import { Connection } from '@celo/connect'
import { LocalWallet } from '@celo/wallet-local'
import Web3 from 'web3'

/*
 * A script that reads a backwards compatibility report, deploys changed contracts, and creates
 * a corresponding JSON file to be proposed with `celocli governance:propose`
 *
 * Expects the following flags:
 *   report: The filepath of the backwards compatibility report
 *   network: The network for which artifacts should be
 *
 * Run using truffle exec, e.g.:
 * truffle exec scripts/truffle/make-release \
 *   --network alfajores --build_directory build/alfajores/ --report report.json \
 *   --initialize_data initialize_data.json --proposal proposal.json
 */

module.exports = async (callback: (error?: any) => number) => {
  try {
    const argv = require('minimist')(process.argv.slice(2), {
      string: ['key', 'amount'],
    })

    const web3: Web3 = new Web3('http://127.0.0.1:8545')

    // web3.eth.accounts.privateKeyToAccount(
    //   '0x3262cbe4bdd55a27ba11ca4674fc91afe0539f850f3074dc06928c5bf9a0e10d'
    // )

    var burnerAddress: string

    const connection = new Connection(web3, new LocalWallet())

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

    await web3.eth.personal.unlockAccount(burnerAddress, 'A', 600)

    // connection.getAccounts().then(console.log)

    // await sendTransactionWithPrivateKey(
    //   web3,
    //   null,
    //   '0x3262cbe4bdd55a27ba11ca4674fc91afe0539f850f3074dc06928c5bf9a0e10d',
    //   { to: burnerAddress, amount: '1000000000000000000' }
    // )

    await connection.sendTransaction({
      from: '0x7F871c887e6a430D3c1F434737F568B07559F9E7',
      to: burnerAddress,
      value: '1000000000000000000',
    })

    web3.eth.personal.defaultAccount = burnerAddress
    web3.eth.defaultAccount = burnerAddress
    argv.from = burnerAddress

    connection.getBalance(burnerAddress).then(console.log)

    // connection.getAccounts().then(console.log)

    // connection.defaultAccount = '0x7F871c887e6a430D3c1F434737F568B07559F9E7'
    callback()
  } catch (error) {
    callback(error)
  }
}
