import {
  InputQuery,
  FunctionResult,
  DiscountApplicationStrategy,
  ProductVariant,
  Target,
} from "../generated/api";

const EMPTY_DISCOUNT: FunctionResult = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

type Tier = {
  quantity: number;
  amount: number;
  title: string;
};

type MetafieldValue = {
  title: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FIXED_BUNDLE_PRICE';
  products: string[];
  collections: string[];
  tiers: Tier[];
};

type CartItem = InputQuery["cart"]["lines"][number];

type PropertyName = string | number | symbol;

/**
 * Groups an array of items based on a key returned by the iteratee function.
 * @param collection The array to group
 * @param iteratee A function that returns the grouping key for an item
 * @returns An object with keys as group identifiers and values as arrays of grouped items
 */
export function groupBy<T, K extends PropertyName>(
  collection: T[],
  iteratee: (obj: T) => K
): Record<string, T[]> {
  const result: Record<string, T[]> = {};

  for (const item of collection) {
    const key = iteratee(item).toString();
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }

  return result;
}

/**
 * Combines multiple targets with the same product variant ID by summing their quantities.
 * @param targets An array of Target objects
 * @returns A new array of Target objects with consolidated quantities
 */
function combineTargets(targets: Target[]): Target[] {
  const combinedTargets: { [id: string]: number } = {};

  // Iterate through each target and sum quantities for each productVariant.id
  targets.forEach((target) => {
    const id = target.productVariant.id;
    const quantity = target.productVariant.quantity;

    if (combinedTargets[id] === undefined) {
      combinedTargets[id] = quantity || 0;
    } else {
      combinedTargets[id] += quantity || 0;
    }
  });

  // Generate a new array of targets with combined quantities
  const result: Target[] = Object.keys(combinedTargets).map((id) => ({
    productVariant: {
      id,
      quantity: combinedTargets[id],
    },
  }));

  return result;
}

type Options = {
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | 'FIXED_BUNDLE_PRICE';
  title: string;
};

type PercentageValue = {
  percentage: {
    value: string;
  };
};

type FixedAmountValue = {
  fixedAmount: {
    amount: string;
  };
};

/**
 * Combines multiple discounts into a single discount by summing their values.
 * @param discounts An array of discount objects
 * @returns A single discount object with a message, value, and targets
 */
function combineDiscounts(
  discounts: ReturnType<typeof calculateBestDiscountCombo>,
  fallBackTitle: string
) {
  if (discounts.length === 0) return [];
  if (discounts.length === 1)
    return [
      {
        ...discounts[0],
        targets: combineTargets(
          discounts[0].targets.map((item) => ({
            productVariant: {
              id: (item.merchandise as ProductVariant).id,
              quantity: item.quantity,
            },
          }))
        ),
      },
    ];
  // Combine discount values
  const totalDiscountValue = discounts.reduce((final, discount) => {
    let discountedAmount = 0;
    for (const target of discount.targets) {
      if ((discount as any).value["percentage"]) {
        discountedAmount +=
          (target.cost.amountPerQuantity.amount *
            target.quantity *
            parseFloat((discount.value as PercentageValue).percentage.value)) /
          100;
      } else {
        discountedAmount += parseFloat(
          (discount.value as FixedAmountValue).fixedAmount.amount
        );
      }
    }
    return final + discountedAmount;
  }, 0);

  const combinedTargets = combineTargets(
    discounts
      .map((discount) =>
        discount.targets.map((item) => ({
          productVariant: {
            id: (item.merchandise as ProductVariant).id,
            quantity: item.quantity,
          },
        }))
      )
      .flat()
  );

  return [
    {
      message: fallBackTitle,
      value: {
        fixedAmount: {
          amount: totalDiscountValue.toString(),
        },
      },
      targets: combinedTargets,
    },
  ];
}

/**
 * Calculates the best discount combination based on the given line items and discount tiers.
 * It determines the highest applicable tier, applies the discount, and groups the line items.
 *
 * @param lineItems - Array of cart items to be discounted
 * @param tiers - Array of discount tiers, each with a quantity threshold and discount amount
 * @param options - Object containing discount type and title
 * @returns An array of discount objects, each with a message, value, and targets
 */
function calculateBestDiscountCombo(
  lineItems: CartItem[],
  tiers: Tier[],
  options: Options
) {
  tiers.sort((a, b) => b.amount - a.amount);
  const expandedLineItems: CartItem[] = lineItems.flatMap((lineItem) =>
    Array(lineItem.quantity)
      .fill(lineItem)
      .map((lineItem) => ({ ...lineItem, quantity: 1 }))
  );

  let discounts: {
    message: string;
    value: PercentageValue | FixedAmountValue;
    targets: CartItem[];
  }[] = [];
  const appliedQuantityOfTier = Math.max(
    ...tiers.reduce(
      (prev: number[], item: Tier) => {
        if (item.quantity <= expandedLineItems.length)
          return [...prev, item.quantity];
        return prev;
      },
      [0]
    )
  );

  const appliedTier = tiers.find(
    (tier) => appliedQuantityOfTier === tier.quantity
  );
  if (appliedTier) {
    if (options.discountType === 'FIXED_BUNDLE_PRICE') {
      // Calculate the total cost of items in the cart
      const totalCost = expandedLineItems.reduce(
        (sum, item) => sum + parseFloat(item.cost.amountPerQuantity.amount),
        0
      );

      // Calculate discount value
      const discountAmount = totalCost - appliedTier.amount;

      // Check if total cost is less than bundle price (invalid case)
      if (discountAmount < 0) {
        throw new Error("Total cost cannot be less than fixed bundle price");
      }

      discounts = [{
        message: appliedTier.title || options.title,
        value: {
          fixedAmount: {
            amount: discountAmount.toFixed(2), // Format as string with 2 decimals
          },
        },
        targets: Object.values(groupBy(
          expandedLineItems,
          item => item.id
        )).reduce((final, lineItemGroups) => {
          return [
            ...final,
            {
              ...lineItemGroups[0],
              quantity: lineItemGroups.reduce((sum, item) => sum + item.quantity, 0),
            },
          ];
        }, [] as CartItem[]),
      }];
    } else {
      // Apply percentage or fixed amount discounts
      discounts = [{
        message: appliedTier.title || options.title,
        value: options.discountType === 'PERCENTAGE'
          ? { percentage: { value: appliedTier.amount.toString() } }
          : { fixedAmount: { amount: appliedTier.amount.toString() } },
        targets: Object.values(groupBy(
          expandedLineItems,
          item => item.id
        )).reduce((final, lineItemGroups) => {
          return [
            ...final,
            {
              ...lineItemGroups[0],
              quantity: lineItemGroups.reduce((sum, item) => sum + item.quantity, 0),
            },
          ];
        }, [] as CartItem[]),
      }];
    }
  }

  return discounts;
}
export default function run(input: InputQuery): FunctionResult {
  const definition: MetafieldValue = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}"
  );

  if (input.cart.buyerIdentity?.purchasingCompany?.company?.id) {
    return EMPTY_DISCOUNT;
  }

  // Sort tiers from smallest to largest quantity
  const { discountType, products, tiers, title } = definition;

  const isCartItemValid = (line: CartItem) => {
    if (line.sellingPlanAllocation) return false;
    if (products.length > 0)
      return products.includes(
        (line.merchandise as ProductVariant).product?.id
      );
    return (line.merchandise as ProductVariant).product.inAnyCollection;
  };
  tiers.sort((a, b) => a.quantity - b.quantity);

  const filteredLineItems = input.cart.lines.filter(isCartItemValid);
  const discounts = calculateBestDiscountCombo(filteredLineItems, tiers, {
    discountType,
    title,
  });

  const result: FunctionResult = {
    discountApplicationStrategy: DiscountApplicationStrategy.Maximum,
    discounts: combineDiscounts(discounts, title),
  };
  if (!result.discounts.length) return EMPTY_DISCOUNT;
  return result;
}
