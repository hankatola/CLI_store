
//  npm modules
//  ‾‾‾‾‾‾‾‾‾‾‾‾

// const Sql = require('./sql.js')
const inquire = require('inquirer')
const mysql = require('mysql')
const Table = require('cli-table2')
const colors = require('colors')


//  global variables
//  ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'sknights',
    database: 'bamazon_db',
    multipleStatements: true
})

//  function farm
//  ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
const main = ()=>{
    connection.connect((err)=>{
        if (err) throw err

        // functions
        const getAll = (func)=>{
            connection.query('select * from products',(err,data)=>{
                console.log('\033[2J')
                if (err) throw err
                let table = new Table({
                    head:[
                        colors.green("ID"),
                        colors.green("Product"),
                        colors.green("Department"),
                        colors.green("Price"),
                        colors.green("Inventory")
                    ]
                })
                for (let i in data) {
                    table.push([
                        colors.white(data[i].id),
                        colors.white(data[i].product_name),
                        colors.white(data[i].department_name),
                        {hAlign: 'right',content: colors.white(data[i].price)},
                        {hAlign: 'right',content: colors.white(data[i].quantity)}
                    ])
                }
                console.log(table.toString())
                return func(data)
            })
        }
        const inq = (data)=>{
            let dataId = []
            for (let i in data) {
                dataId.push(JSON.stringify(parseInt(i)+1))
            }
            inquire.prompt([
                {
                    message: 'ID of product you would like to buy:',
                    name: 'id',
                    type: 'rawlist',
                    choices: dataId
                },
                {
                    message: 'How many would you like?',
                    name: 'qty',
                    type: 'input'
                }
            ]).then((x)=>{
                console.log(x.id)
                x.qty = parseInt(x.qty)
                x.id = parseInt(x.id) - 1
                let dbQty = parseInt(data[x.id].quantity)
                let dbNSold = parseInt(data[x.id].num_sold)
                let remaining_stock = dbQty - x.qty
                let ttlSold = dbNSold + x.qty
                if (remaining_stock < 0) {
                    // insufficient quantity
                    console.log('Bamazon does not have that many in stock')
                } else {
                    let cost = parseFloat(data[x.id].price) * x.qty
                    let s = `You purchased ${x.qty} ${data[x.id].product_name}(s) for a total cost of ${cost}`
                    console.log(s)
                    let id = parseInt(x.id)+1
                    // let a = `update products set quantity = ${remaining_stock} where id = ${id}`
                    let a = `update products set ? where ?`
                    let b = [{quantity:remaining_stock,num_sold:ttlSold},{id:id}]
                    console.log('connect again')
                    connection.query(a,b,(err,data)=>{
                        if (err) throw err
                    })
                }
                inquire.prompt({
                    message: 'Go again?',
                    type: 'confirm',
                    default: true,
                    name: 'again'
                }).then((c)=>{
                    if (c.again) getAll(inq)
                    else {
                        return connection.end()
                    }
                })
            })
        }
        getAll(inq)
    })
}

main()