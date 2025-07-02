import mongoose from "mongoose"

const InventorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    item: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    minStock: { type: Number, required: true },
    maxStock: { type: Number, required: true },
    location: { type: String, required: true },
    receivedDate: { type: String, required: true },
    expiryDate: { type: String, required: true },
    supplier: { type: String, required: true },
    costPerUnit: { type: Number, required: true },
    status: { type: String, required: true },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Inventory || mongoose.model("Inventory", InventorySchema)
