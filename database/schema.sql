CREATE DATABASE metro_smart_card_db;

USE metro_smart_card_db;

CREATE TABLE Passengers (
    passenger_id INT AUTO_INCREMENT PRIMARY KEY,
    passenger_name VARCHAR(100) NOT NULL,

    country_code VARCHAR(5) NOT NULL,
    mobile_number VARCHAR(14) NOT NULL,

    email VARCHAR(100),

    CHECK (country_code REGEXP '^\\+[1-9][0-9]{0,3}$'),
    CHECK (mobile_number REGEXP '^[0-9]{4,14}$'),
    CHECK (
        CHAR_LENGTH(REPLACE(country_code, '+', ''))
        + CHAR_LENGTH(mobile_number) <= 15
    )
);

CREATE TABLE SmartCards (
    card_id INT AUTO_INCREMENT PRIMARY KEY,
    passenger_id INT NOT NULL,
    card_number CHAR(9) NOT NULL UNIQUE,
    balance DECIMAL(10,2) DEFAULT 0.00,

    FOREIGN KEY (passenger_id)
        REFERENCES Passengers(passenger_id),

    CHECK (balance >= 0),
    CHECK (card_number REGEXP '^METRO[0-9]{4}$')
);

CREATE TABLE Stations (
    station_id INT AUTO_INCREMENT PRIMARY KEY,
    station_name VARCHAR(100) NOT NULL,
    line_name VARCHAR(50) NOT NULL
);

CREATE TABLE Transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    card_id INT NOT NULL,
    station_id INT NOT NULL,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    fare_amount DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (card_id)
        REFERENCES SmartCards(card_id),

    FOREIGN KEY (station_id)
        REFERENCES Stations(station_id),

    CHECK (fare_amount >= 0)
);