import Product from "../model/product.model.js";
import Order from "../model/order.model.js";
import mongoose from "mongoose";

export const topProducts = async (req, res) => {
  try {
    const { month, year } = req.query;

    // STEP 1: Validate input
    const m = Number(month);
    const y = Number(year);

    if (!m || m < 1 || m > 12 || !y || y < 2000) {
      return res.status(400).json({ message: "Invalid month or year provided" });
    }

    // STEP 2: Create date range
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 1);

    // STEP 3–7: Aggregation pipeline
    const result = await Order.aggregate([
      // STEP 3: Filter orders by month
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },

      // STEP 4: Break items array into individual docs
      {
        $unwind: "$products"
      },

      // STEP 5: Group by productId and calculate totals
      {
        $group: {
          _id: "$products.productId",
          totalQuantitySold: { $sum: "$products.quantity" },
          totalRevenue: {
            $sum: {
              $multiply: ["$products.quantity", "$products.price"]
            }
          }
        }
      },

      // STEP 6: Sort by revenue (descending)
      {
        $sort: { totalRevenue: -1 }
      },

      // STEP 7: Limit to top 5 products
      {
        $limit: 5
      },

      {
        $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product"
        }
      },
      {
        $unwind: "$product"
      },
      {
        $project: {
            _id: 0,
            productId: "$_id",
            name: "$product.name",
            category: "$product.category",
            totalQuantitySold: 1,
            totalRevenue: 1
        }
      }
    ]);

    return res.status(200).json({
      month: m,
      year: y,
      topProducts: result
    });

  } catch (error) {
    console.error("Top products error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const monthlySales = async (req, res) => {
    try {
        const {month, year} = req.query;
        const m = Number(month);
        const y = Number(year);
        if(!m || m < 1 || m > 12 || y < 2000) {
            return res.status(400).json({message: "Invalid month or date"})
        };

        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 1);

        const result = await Order.aggregate([
            {$match: {createdAt: {$gte: startDate, $lt: endDate}}},
            {$unwind: "$products"},
            {$lookup: {
                from: "products",
                localField: "products.productId",
                foreignField: "_id",
                as: "productDetails"
            }},
            {$unwind: "$productDetails"},
            {$group: {
                _id: "$productDetails.category",
                totalQuantity: {$sum: "$products.quantity"},
                totalRevenue: {$sum: {$multiply: ["$products.price", "$products.quantity"]}},
                averagePrice: {$avg: "$products.price"}
            }},
            {$sort: {totalRevenue: -1}},
            {$project: {
                _id: 0,
                category: "$_id",
                totalQuantity: 1,
                totalRevenue: 1,
                averagePrice: 1
            }}
        ]);

        return res.status(200).json({
            month: m,
            year: y,
            monthySales: result
        })

    } catch (error) {
        return res.status(500).json({message: error.message + "Internal server error"})
    }
};


export const customerLifetimeValue = async (req, res) => {
  try {
    const {from, to } = req.query;

    const filter = {};
    if(from && to) {
      filter.createdAt = {$gte: new Date(from), $lt: new Date(to)}
    };

    const result = await Order.aggregate([
      {$match: filter},
      {$unwind: "$products"},
      {$addFields: {
        productRevenue: {$multiply: ["$products.price", "$products.quantity"]}
      }},
      {$group: {
        _id:{
          orderId: "$_id",
          userId: "$userId"
        },
        orderRevenue: {$sum: "$productRevenue"},
        orderQuantity: {$sum: "$products.quantity"},
        createdAt: {$first: "$createdAt"}
      }},
       {
        $group: {
          _id: "$_id.userId",
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: "$orderQuantity" },
          totalRevenue: { $sum: "$orderRevenue" },
          firstOrder: { $min: "$createdAt" },
          lastOrder: { $max: "$createdAt" }
        }
      },
       {
        $addFields: {
          averageOrderValue: {
            $divide: ["$totalRevenue", "$totalOrders"]
          }
        }
      }
    ]);

    return res.status(200).json({
      customer: result
    })

  } catch (error) {
    return res.status(500).json({message: error.message + "Internal server error"})
  }
};

export const customerCohort = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = month;
    const y = year;
    if(!m || m < 1 || !y || y < 2000) {
      return res.status(400).json({message: "Invalid month or year provided"})
    };
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 1);

    const result = await Order.aggregate([
      {$match: {createdAt: {$gte: startDate, $lt: endDate}}},
      {$unwind: "$products"},
      {$addFields: {productRevenue: {$multiply: ["$products.price", "$products.quantity"]}}},
      {$group: {
        _id: {
          orderId: "$_id",
          userId: "$userId"
        },
        orderRevenue: {$sum: "$productRevenue"},
        createdAt: {$first: "$createdAt"}
      }},
      {$group: {
        _id: "$_id.userId",
        firstOrderDate: {$min: "$createdAt"},
        totalOrder: {$sum: 1},
        totalRevenue: {$sum: "$orderRevenue"}
      }},
      {$addFields: {
        cohortYear: {$year: "$firstOrderDate"},
        cohortMonth: {$month: "$firstOrderDate"},
      }},
      {
        $group: {
          _id: {
            year: "$cohortYear",
            month: "$cohortMonth"
          },
          customers: { $sum: 1 },
          totalRevenue: { $sum: "$totalRevenue" },
          averageRevenuePerCustomer: {
            $avg: "$totalRevenue"
          }
        }
      }
    ]);

    return res.status(200).json({
      result
    })
  } catch (error) {
    return res.status(500).json({message: error.message + "Internal server error"})
  }
}