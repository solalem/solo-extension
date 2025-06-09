---
applyTo: '/*.json'
---
# DDD Domain Model Extraction Guidance

Use requirements as your main source. Extract a clear, actionable domain model.

## 1. Understand the Domain
- Ignore document titles and other document structures and focus on content.
- Read requirements carefully. Note key nouns (things), verbs (actions), and adjectives (qualities).
- Build a shared language (Ubiquitous Language) with clear definitions for all terms.
- Start a glossary for important terms.

## 2. Identify Bounded Contexts
- Find areas where terms or processes differ (e.g., "Product" in sales vs. inventory).
- Group business capabilities into Core, Supporting, or Generic subdomains.
- Map how contexts interact (e.g., Customer-Supplier, Shared Kernel).

## 3. Model Within Contexts
- **Entities:** Objects with identity and lifecycle (e.g., Customer, Order).
- **Value Objects:** Descriptive, immutable, no identity (e.g., Address, Money).
- **Aggregates:** Groups of entities/value objects that change together. Identify the root entity.
- **Domain Services:** Operations not belonging to a single entity (e.g., Calculate Discount).
- **Domain Events:** Important occurrences (e.g., OrderPlaced, PaymentReceived).

## 4. Create Model Files
- For each context, create `<context.name>-model.json` in `samples/models`.
- Include name, description, module name (if any), and all entities, value objects, aggregates, and events.
- Use the following template.

```json
{
  "name": "OrderManagement",
  "description": "test1",
  "module": "OrderTaking",
  "entities": [
    {
      "name": "Order",
      "aggregate": "Order", // this is the root entity of the aggregate
      "type": "Entity", // or "ValueObject" or "DomainService"
      "description": "An order from customer",
      "properties": [
        { "name": "Date", "description": "Date of order taken", "type": "DateTime", "required": true },
        { "name": "Status", "description": "Status", "type": "int", "options": [ { "name": "New", "value": 100 },  { "name": "Processing", "value": 102 }] },
        { "name": "OrderLines", "description": "OrderLines", "type": "OrderLine", "array": true },
      ]
    },
    {
      "name": "OrderLine",
      "aggregate": "Order",
      "type": "Entity", // or "ValueObject" or "DomainService"
      "description": "Item in an order.",
      "properties": [
        { "name": "ProductId", "description": "Product identifier", "type": "int" },
        { "name": "Quantity", "description": "Quantity", "type": "int" },
        { "name": "UnitPrice", "description": "Unit Price", "type": "Decimal" },
        { "name": "OrderId", "description": "Parent Order Id", "type": "String" }
      ]
    }
  ]
}