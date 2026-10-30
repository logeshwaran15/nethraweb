import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Screen } from "@/components/shop/AppChrome";
import { Button } from "@/components/ui/button";
import { OrderInvoice, type InvoiceItem } from "@/components/shop/OrderInvoice";

type OrderRow = {
  Orderkey: string;
  OrderNumber: string;
  Subtotal: string | number;
  Discount: string | number;
  ShippingFee: string | number;
  Total: string | number;
  PaymentMethod: string;
  PaymentStatus: string;
  RazorpayPaymentId: string | null;
  ShippingName: string | null;
  ShippingPhone: string | null;
  ShippingAddress: string | null;
  CreatedOn: string;
};

type OrderItemRow = {
  ProductName: string;
  ProductImagePath: string | null;
  Qty: string | number;
  Price: string | number;
};

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const orderKey = searchParams.get("order") ?? undefined;
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);

  useEffect(() => {
    if (!orderKey) return;
    apiGet<OrderRow>(`/api/orders.php?key=${orderKey}`)
      .then(setOrder)
      .catch(() => setOrder(null));
    apiGet<OrderItemRow[]>(`/api/order_items.php?orderKey=${orderKey}`)
      .then(setItems)
      .catch(() => setItems([]));
  }, [orderKey]);

  const invoiceItems: InvoiceItem[] = items.map((i) => ({
    name: i.ProductName,
    qty: Number(i.Qty),
    price: Number(i.Price),
  }));

  return (
    <Screen title="Order Confirmed" back>
      <div className="gradient-blush px-6 py-10 text-center print:hidden">
        <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
        <h2 className="text-h1 mt-4 text-primary">Thank You!</h2>
        <p className="text-body-lg mt-1 text-muted-foreground">
          Your order has been placed successfully.
        </p>
      </div>

      <div className="space-y-4 p-4">
        {order && (
          <OrderInvoice
            order={{
              orderNumber: order.OrderNumber,
              createdOn: order.CreatedOn,
              shippingName: order.ShippingName,
              shippingPhone: order.ShippingPhone,
              shippingAddress: order.ShippingAddress,
              paymentMethod: order.PaymentMethod,
              paymentStatus: order.PaymentStatus,
              paymentReference: order.RazorpayPaymentId,
              subtotal: Number(order.Subtotal),
              shippingFee: Number(order.ShippingFee),
              total: Number(order.Total),
            }}
            items={invoiceItems}
          />
        )}

        <div className="print:hidden">
          <Button asChild variant="brand" size="ctaLg" className="w-full">
            <Link to={orderKey ? `/track?order=${orderKey}` : "/track"}>Track Your Order</Link>
          </Button>
          <Button asChild variant="brandOutline" size="ctaLg" className="mt-3 w-full">
            <Link to="/orders">View My Orders</Link>
          </Button>
          <Link
            to="/categories"
            className="text-caption mt-2 block py-2 text-center font-semibold text-maroon-soft"
          >
            Continue Shopping &rarr;
          </Link>
        </div>
      </div>
    </Screen>
  );
}
