--Drop existing table if they exist
DROP TABLE IF EXISTS employee;
DROP TABLE IF EXISTS role;
Drop TABLE IF EXISTS department;

-- Create Department Table
CREATE TABLE department (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- Create Role Table
CREATE TABLE role (
    id SERIAL PRIMARY KEY,
    title VARCHAR(50) NOT NULL,
    salary NUMERIC(10, 2) NOT NULL,
    department_id INT REFERENCES department(id) ON DELETE CASCADE
);

-- Create Employee Table
CREATE TABLE employee (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role_id INT REFERENCES role(id) ON DELETE CASCADE,
    manager_id INT REFERENCES employee(id) ON DELETE SET NULL
);
