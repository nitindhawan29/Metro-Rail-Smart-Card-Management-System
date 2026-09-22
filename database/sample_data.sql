USE metro_smart_card_db;

INSERT INTO Passengers
(passenger_name, country_code, mobile_number, email)
VALUES
('Rahul Sharma', '+91', '9876543210', 'rahul@gmail.com'),
('Priya Singh', '+91', '9876501234', 'priya@gmail.com'),
('Aman Verma', '+91', '9123456780', 'aman@gmail.com');


INSERT INTO SmartCards
(passenger_id, card_number, balance)
VALUES
(1, 'METRO1001', 500.00),
(2, 'METRO1002', 350.00),
(3, 'METRO1003', 700.00);


INSERT INTO Stations
(station_name, line_name)
VALUES
('MP Nagar', 'Orange Line'),
('AIIMS', 'Orange Line'),
('Rani Kamlapati', 'Orange Line'),
('Subhash Nagar', 'Orange Line'),
('Karond Square', 'Blue Line');


INSERT INTO Transactions
(card_id, station_id, fare_amount)
VALUES
(1, 1, 25.00),
(1, 2, 30.00),
(2, 3, 35.00),
(3, 1, 20.00),
(3, 4, 25.00);