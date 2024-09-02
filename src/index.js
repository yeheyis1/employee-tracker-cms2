const inquirer = require('inquirer');
const { makeQuery } = require('./util/queries.js');

async function startApp() {
    let exit = false;
    while (!exit) {
        const { choice } = await inquirer.prompt([
            {
                type: 'list',
                name: 'choice',
                message: 'What would you like to do?',
                choices: [
                    'Add Employee',
                    'Update Employee Role',
                    'View All Roles',
                    'Add Role',
                    'View All Departments',
                    'Add Department',
                    'View All Employees',
                    'Quit'
                ]
            }
        ]);

        if (choice === 'Quit') {
            exit = true;
            console.log('Goodbye!');
        } else {
            try {
                await makeQuery(choice);
            } catch (error) {
                console.log('An error occurred:', error);
            }
        }
    }
}

startApp();
