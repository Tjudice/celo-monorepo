import { Connection } from '@celo/connect'
import { sendTransactionWithPrivateKey } from '@celo/protocol/lib/web3-utils'
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

    console.log(argv.key)

    const web3: Web3 = new Web3('http://127.0.0.1:8545')

    // web3.eth.accounts.privateKeyToAccount(
    //   '0x3262cbe4bdd55a27ba11ca4674fc91afe0539f850f3074dc06928c5bf9a0e10d'
    // )

    var burnerAddress: string

    const connection = new Connection(web3, new LocalWallet())

    connection.addAccount('0x3262cbe4bdd55a27ba11ca4674fc91afe0539f850f3074dc06928c5bf9a0e10d')

    // connection.getBalance('0x7F871c887e6a430D3c1F434737F568B07559F9E7').then(console.log)

    // connection.getAccounts().then((e) => (connection.defaultAccount = e[0]))

    // connection.getAccounts().then(console.log)
    // connection.getAccounts()

    // var burnerAddress: string = await
    //   connection.getAccounts().then(function (e) {
    //     const burnerAddress = e[0]
    //   })

    const prom = await connection.getAccounts()

    burnerAddress = prom[0]

    console.log(burnerAddress)

    await web3.eth.personal.unlockAccount(burnerAddress, 'A', 0)

    // connection.getAccounts().then(console.log)

    await sendTransactionWithPrivateKey(
      web3,
      null,
      '0x3262cbe4bdd55a27ba11ca4674fc91afe0539f850f3074dc06928c5bf9a0e10d',
      { to: burnerAddress, value: '10000000000000000000', gasPrice: '100000000000' }
    )

    var bal: string = '0'

    while (bal === '0') {
      bal = await connection.getBalance(burnerAddress)
      console.log(bal)
    }

    // var amount: string = '1000000000000000000'

    // if (argv.amount) {
    //   amount = argv.amount
    // }

    // await connection.sendTransaction({
    //   from: '0x7F871c887e6a430D3c1F434737F568B07559F9E7',
    //   to: burnerAddress,
    //   value: '1000000000000000000',
    //   gasPrice: '100000000000',
    // })

    // web.eth.personal.defaultAccount = burnerAddress
    // web.eth.defaultAccount = burnerAddress
    // connection.getBalance(burnerAddress).then(console.log)
    // process.env.FROM_BURNER = burnerAddress

    const fs = require('fs')

    fs.writeFileSync('../../burner.txt', burnerAddress)
    // connection.defaultAccount = '0x7F871c887e6a430D3c1F434737F568B07559F9E7'
    callback()
  } catch (error) {
    callback(error)
  }
}
