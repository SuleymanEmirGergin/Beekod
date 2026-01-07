USE `beekod`;

INSERT INTO products (barcode, name, price, stock, currency)
VALUES
  ("bee252525", "Bee 252525 Bracelet", 500, 5, "TRY"),
  ("bee999888", "Bee 999888 Necklace", 129, 20, "TRY")
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  price = VALUES(price),
  stock = VALUES(stock),
  currency = VALUES(currency);
