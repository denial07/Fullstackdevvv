import mongoose, { Schema, models, model } from "mongoose";

const InventorySchema = new Schema({
  id: String,
  item: String,
  category: String,
  quantity: Number,
  unit: String,
  minStock: Number,
  maxStock: Number,
  location: String,
  receivedDate: Date,
  expiryDate: Date,
  supplier: String,
  costPerUnit: Number,
  status: {
    type: String,
    enum: ["In Stock", "Low Stock", "Out of Stock", "Expired"], // you can modify based on your needs
  },
});

const Inventory = models.Inventory || model("Inventory", InventorySchema);
export default Inventory;
