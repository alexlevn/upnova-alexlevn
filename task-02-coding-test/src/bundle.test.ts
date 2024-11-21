import { expect, it, describe } from "vitest";
import productDiscounts from "./bundle-builder";

describe("bundle builder v2", () => {
  it("should handle percentage discounts", () => {
    const result = productDiscounts({
      cart: {
        buyerIdentity: null,
        lines: [
          {
            id: "gid://shopify/CartLine/0",
            quantity: 3,
            sellingPlanAllocation: null,
            cost: {
              amountPerQuantity: {
                amount: "10.95",
                currencyCode: "EUR",
              },
            },
            merchandise: {
              __typename: "ProductVariant",
              id: "gid://shopify/ProductVariant/39370591273049",
              product: {
                id: "gid://shopify/Product/Apple",
              },
            },
          },
          {
            id: "gid://shopify/CartLine/1",
            quantity: 3,
            sellingPlanAllocation: null,
            cost: {
              amountPerQuantity: {
                amount: "10.95",
                currencyCode: "EUR",
              },
            },
            merchandise: {
              __typename: "ProductVariant",
              id: "gid://shopify/ProductVariant/32385157005401",
              product: {
                id: "gid://shopify/Product/Banana",
              },
            },
          },
        ],
      },
      discountNode: {
        metafield: {
          value: JSON.stringify({
            id: "148",
            tiers: [
              { title: "3 FRUITS - 10% OFF", amount: 10, quantity: 3 },
              { title: "6 FRUITS - 17% OFF", amount: 17, quantity: 6 },
              { title: "9 FRUITS - 20% OFF", amount: 20, quantity: 9 },
            ],
            collections: [],
            products: [
              "gid://shopify/Product/Apple",
              "gid://shopify/Product/Banana",
              "gid://shopify/Product/Cherry",
              "gid://shopify/Product/Date",
              "gid://shopify/Product/Elderberry",
              "gid://shopify/Product/Fig",
              "gid://shopify/Product/Grape",
              "gid://shopify/Product/Honeydew",
              "gid://shopify/Product/Kiwi",
              "gid://shopify/Product/Lemon",
              "gid://shopify/Product/Mango",
              "gid://shopify/Product/Nectarine",
              "gid://shopify/Product/Orange",
              "gid://shopify/Product/Papaya",
              "gid://shopify/Product/Quince",
              "gid://shopify/Product/Raspberry",
              "gid://shopify/Product/Strawberry",
              "gid://shopify/Product/Tangerine",
              "gid://shopify/Product/Ugli",
              "gid://shopify/Product/Voavanga",
              "gid://shopify/Product/Watermelon",
              "gid://shopify/Product/Xigua",
              "gid://shopify/Product/Yuzu",
              "gid://shopify/Product/Zucchini",
              "gid://shopify/Product/Apricot",
              "gid://shopify/Product/Blackberry",
              "gid://shopify/Product/Coconut",
              "gid://shopify/Product/Durian",
              "gid://shopify/Product/Eggplant",
              "gid://shopify/Product/Feijoa",
              "gid://shopify/Product/Guava",
              "gid://shopify/Product/Huckleberry",
            ],
            discountType: "PERCENTAGE",
            title: "Chroma Bundle Builder",
            allowStackingWithSubscription: false,
          }),
        },
      },
    } as any);

    console.log(JSON.stringify(result, null, 2));
    expect(result.discounts.length).toBe(1);
  });

  it("should handle fixed bundle price discounts", () => {
    const result = productDiscounts({
      cart: {
        buyerIdentity: null,
        lines: [
          {
            id: "gid://shopify/CartLine/0",
            quantity: 3,
            sellingPlanAllocation: null,
            cost: {
              amountPerQuantity: {
                amount: "5.00",
                currencyCode: "USD",
              },
            },
            merchandise: {
              __typename: "ProductVariant",
              id: "gid://shopify/ProductVariant/1234567890",
              product: {
                id: "gid://shopify/Product/Orange",
              },
            },
          },
          {
            id: "gid://shopify/CartLine/1",
            quantity: 3,
            sellingPlanAllocation: null,
            cost: {
              amountPerQuantity: {
                amount: "5.00",
                currencyCode: "USD",
              },
            },
            merchandise: {
              __typename: "ProductVariant",
              id: "gid://shopify/ProductVariant/0987654321",
              product: {
                id: "gid://shopify/Product/Grape",
              },
            },
          },
        ],
      },
      discountNode: {
        metafield: {
          value: JSON.stringify({
            id: "149",
            tiers: [
              { title: "3 FRUITS FOR $10", amount: 10, quantity: 3 },
              { title: "6 FRUITS FOR $17", amount: 17, quantity: 6 },
              { title: "9 FRUITS FOR $20", amount: 20, quantity: 9 },
            ],
            collections: [],
            products: [
              "gid://shopify/Product/Orange",
              "gid://shopify/Product/Grape",
            ],
            discountType: "FIXED_BUNDLE_PRICE",
            title: "Fixed Bundle Price",
            allowStackingWithSubscription: false,
          }),
        },
      },
    } as any);

    expect(result.discounts.length).toBe(1);
    expect(result.discounts[0].value.fixedAmount?.amount).toBe("13.00");
    console.log(JSON.stringify(result, null, 2));
  });
});
