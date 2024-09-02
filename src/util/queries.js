const { Pool } = require('pg');
const inquirer = require('inquirer');

// Create a new PostgreSQL connection pool
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'Forwork1',
    database: 'employee_db'
});

// Main function to handle different queries
async function makeQuery(queryString) {
    const client = await pool.connect();
    try {
        switch (queryString) {
            case 'View All Departments':
                await viewTable('SELECT id, name FROM department');
                break;

            case 'View All Employees':
                await viewTable(`
                    SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary,
                           CONCAT(m.first_name, ' ', m.last_name) AS manager
                    FROM employee e
                    LEFT JOIN role r ON e.role_id = r.id
                    LEFT JOIN department d ON r.department_id = d.id
                    LEFT JOIN employee m ON e.manager_id = m.id;
                `);
                break;

            case 'View All Roles':
                await viewTable(`
                    SELECT r.id, r.title, d.name AS department, r.salary
                    FROM role r
                    LEFT JOIN department d ON r.department_id = d.id;
                `);
                break;

            case 'Add Department':
                const { name } = await inquirer.prompt({
                    type: 'input',
                    name: 'name',
                    message: 'What is the name of the department?',
                });
                const departmentResult = await insertIntoTable('INSERT INTO department (name) VALUES ($1) RETURNING *', [name]);
                console.log(`Added ${departmentResult.rows[0].name} to the database`);
                break;

            case 'Add Role':
                const roleAnswers = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'title',
                        message: 'What is the name of the role?',
                    },
                    {
                        type: 'input',
                        name: 'salary',
                        message: 'What is the salary for this role?',
                    }
                ]);

                const departmentResults = await client.query('SELECT id, name FROM department');
                const departmentChoices = departmentResults.rows.map(department => ({
                    name: department.name,
                    value: department.id
                }));

                const { department_id } = await inquirer.prompt({
                    type: 'list',
                    name: 'department_id',
                    message: 'What department does the role belong to?',
                    choices: departmentChoices
                });

                const roleResult = await insertIntoTable(
                    'INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3) RETURNING *',
                    [roleAnswers.title, roleAnswers.salary, department_id]
                );
                console.log(`Added role ${roleResult.rows[0].title} to the database`);
                break;

            case 'Add Employee':
                const employeeAnswers = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'first_name',
                        message: "What is the employee's first name?",
                    },
                    {
                        type: 'input',
                        name: 'last_name',
                        message: "What is the employee's last name?",
                    },
                    {
                        type: 'list',
                        name: 'role_id',
                        message: "What is the employee's role?",
                        choices: async () => {
                            const roles = await client.query('SELECT id, title FROM role');
                            return roles.rows.map(role => ({
                                name: role.title,
                                value: role.id
                            }));
                        }
                    },
                    {
                        type: 'list',
                        name: 'manager_id',
                        message: "Who is the employee's manager?",
                        choices: async () => {
                            const managers = await client.query('SELECT id, CONCAT(first_name, \' \', last_name) AS name FROM employee');
                            return managers.rows.map(manager => ({
                                name: manager.name,
                                value: manager.id
                            })).concat({ name: 'None', value: null });
                        }
                    }
                ]);

                const employeeResult = await insertIntoTable(
                    'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4) RETURNING *',
                    [employeeAnswers.first_name, employeeAnswers.last_name, employeeAnswers.role_id, employeeAnswers.manager_id]
                );
                console.log(`Added employee ${employeeResult.rows[0].first_name} ${employeeResult.rows[0].last_name} to the database`);
                break;

            case 'Update Employee Role':
                // Fetch employees for selection
                const employees = await client.query('SELECT id, CONCAT(first_name, \' \', last_name) AS name FROM employee');
                const employeeChoices = employees.rows.map(employee => ({
                    name: employee.name,
                    value: employee.id
                }));

                // Prompt for employee selection
                const { employee_id } = await inquirer.prompt({
                    type: 'list',
                    name: 'employee_id',
                    message: "Which employee's role do you want to update?",
                    choices: employeeChoices
                });

                // Fetch roles for selection
                const roles = await client.query('SELECT id, title FROM role');
                const roleChoices = roles.rows.map(role => ({
                    name: role.title,
                    value: role.id
                }));

                // Prompt for new role selection
                const { new_role_id } = await inquirer.prompt({
                    type: 'list',
                    name: 'new_role_id',
                    message: 'Which role do you wnat to assign the selected employee?',
                    choices: roleChoices
                });

                // Update the employee's role in the database
                await client.query('UPDATE employee SET role_id = $1 WHERE id = $2', [new_role_id, employee_id]);
                console.log(`Updated employee's role successfully.`);
                break;

            default:
                console.log('No action implemented for this choice.');
        }
    } catch (err) {
        console.log('Error occurred:', err);
    } finally {
        client.release();
    }
}

// Function to view table contents
async function viewTable(query) {
    let result = await pool.query(query);
    console.table(result.rows);  // Display the result in table format
}

// Function to insert into a table
async function insertIntoTable(query, dataArray) {
    return await pool.query(query, dataArray);  // Insert data and return the result
}

module.exports = {
    makeQuery
};
