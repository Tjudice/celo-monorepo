import { Connection } from '@celo/connect'
import { sendTransactionWithPrivateKey } from '@celo/protocol/lib/web3-utils'
import { RpcWallet } from '@celo/rpc-wallet'
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
      string: ['key', 'staging_key'],
    })
    const fs = require('fs')

    //Use connection to send transactions from local, secure wallet to unsecure address on node
    const web3: Web3 = new Web3('http://127.0.0.1:8545')

    //Get the address of and unlock burner account created in contracts-release.yml
    var burnerAddress: string
    if (argv.key) {
      const connection = new Connection(web3, new LocalWallet())
      const accounts = await connection.getAccounts()
      burnerAddress = accounts[accounts.length - 1]

      connection.addAccount(argv.key)

      await web3.eth.personal.unlockAccount(burnerAddress, 'A', 0, function (err) {
        if (err) {
          console.log('Error accessing burner address!')
        }
      })

      //Send transaction from secure local wallet to burner account on node
      await sendTransactionWithPrivateKey(
        web3,
        null,
        '0x3262cbe4bdd55a27ba11ca4674fc91afe0539f850f3074dc06928c5bf9a0e10d',
        {
          to: burnerAddress,
          value: '10000000000000000000',
          gasPrice: '100000000000',
        }
      )
      fs.writeFileSync('../../burner.txt', burnerAddress)
    } else {
      var wallet: RpcWallet = new RpcWallet(Web3)
      wallet.addAccount(argv.staging_key, 'A')
      wallet.unlockAccount('0x7a35C7d6846350BFd3904E97343e59Eee85cf472', 'A', 1000)
      fs.writeFileSync('../../burner.txt', '0x7a35C7d6846350BFd3904E97343e59Eee85cf472')
    }

    //Save address of burner account in text file so it can be passed to make-release.sh as input

    callback()
  } catch (error) {
    callback(error)
  }
}
