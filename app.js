if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
console.log(process.env.TOKEN)
const express = require("express");
const mongoose = require("mongoose");
const axios = require('axios');
const app = express();
const port = 8080;

let token = process.env.TOKEN;
// MongoDB setup
mongoose.connect("mongodb://localhost:27017/myapp");

const Product = mongoose.model("Product", {
    name: String,
    category: String,
    price: Number,
    rating: Number,
    company: String,
    discount: Number
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/categories/:category/products/", async (req, res) => {
    try {
        const category = req.params.category;
        const { top, minPrice, maxPrice, sort } = req.query;

        const url = `http://20.244.56.144/test/companies/AMZ/categories/${category}/products`;
        const response = await axios.get(url, {
            params: {
                top: top || 10,
                minPrice: minPrice || 1,
                maxPrice: maxPrice || 1000
            },
            headers: {
                Authorization: token
            }
        });
        const products = response.data;

        const productsWithIds = products.map((product) => {
            return { ...product, _id: mongoose.Types.ObjectId() };
        });
        await Product.insertMany(productsWithIds);


        let sortedProducts = [];
        if (sort === "rating") {
            sortedProducts = await Product.find({ category }).sort({ rating: 1 });
        } else if (sort === "price") {
            sortedProducts = await Product.find({ category }).sort({ price: 1 });
        } else if (sort === "company") {
            sortedProducts = await Product.find({ category }).sort({ company: 1 });
        } else if (sort === "discount") {
            sortedProducts = await Product.find({ category }).sort({ discount: 1 });
        } else {
 
            sortedProducts = await Product.find({ category });
        }

        res.json(sortedProducts);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/categories/:category/products/:productId", async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await Product.findById(productId);
        if (!product) {
            res.status(404).send("Product not found");
            return;
        }
        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
