USE metro_smart_card_db;

INSERT INTO Passengers
(passenger_id, passenger_name, country_code, mobile_number, email)
VALUES
(1, 'Rahul Sharma', '+91', '9876543210', 'rahul@gmail.com'),
(2, 'Priya Singh', '+91', '9876501234', 'priya@gmail.com'),
(3, 'Aman Verma', '+91', '9123456780', 'aman@gmail.com');


INSERT INTO SmartCards
(card_id, passenger_id, card_number, balance)
VALUES
(1, 1, 'METRO1001', 500.00),
(2, 2, 'METRO1002', 350.00),
(3, 3, 'METRO1003', 700.00);


INSERT INTO Stations
(station_id, station_name, line_name)
VALUES
(1, 'MP Nagar', 'Orange Line'),
(2, 'AIIMS', 'Orange Line'),
(3, 'Rani Kamlapati', 'Orange Line'),
(4, 'Subhash Nagar', 'Orange Line'),
(5, 'Karond Square', 'Blue Line');


INSERT INTO Transactions
(transaction_id, card_id, station_id, fare_amount)
VALUES
(1, 1, 1, 25.00),
(2, 1, 2, 30.00),
(3, 2, 3, 35.00),
(4, 3, 1, 20.00),
(5, 3, 4, 25.00);