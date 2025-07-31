require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

const faqCategories = [
    {
        id: "general",
        questions: [
            {
                question: "What is Singapore Pallet Works Dashboard?",
                answer:
                    "Singapore Pallet Works Dashboard is a comprehensive management system designed for tracking shipments, managing inventory, processing orders, and monitoring business operations for wood pallet manufacturing and logistics companies.",
            },
            {
                question: "How do I get started with the dashboard?",
                answer:
                    "After logging in with your credentials, you'll see the main dashboard with key metrics. Navigate through different sections using the menu: Shipments for tracking deliveries, Inventory for stock management, and Orders for customer order processing.",
            },
            {
                question: "Can I export data from the dashboard?",
                answer:
                    'Yes, most sections include export functionality. Look for the "Export" button in the top-right corner of data tables. You can export data in various formats including CSV and PDF for reporting purposes.',
            },
            {
                question: "Is the dashboard mobile-friendly?",
                answer:
                    "Yes, the dashboard is fully responsive and works on mobile devices, tablets, and desktop computers. The interface adapts to different screen sizes for optimal viewing and interaction.",
            },
        ],
    },
    // ... Add remaining categories here (copy from your tsx)
];

// Your Mongoose model
const FaqSchema = new mongoose.Schema(
    {
        question: { type: String, required: true },
        answer: { type: String, required: true },
        category: { type: String },
    },
    {
        timestamps: true,
    }
);

const FaqModel = mongoose.models.Faq || mongoose.model("Faq", FaqSchema);

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        await FaqModel.deleteMany({});
        console.log("🧹 Old FAQs cleared");

        const allFaqs = faqCategories.flatMap((cat) =>
            cat.questions.map((q) => ({
                question: q.question,
                answer: q.answer,
                category: cat.id,
            }))
        );

        await FaqModel.insertMany(allFaqs);
        console.log("✅ New FAQs inserted");

        process.exit(0);
    } catch (err) {
        console.error("❌ Error seeding FAQs:", err);
        process.exit(1);
    }
}

seed();
