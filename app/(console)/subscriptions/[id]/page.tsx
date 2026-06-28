import { SubscriptionDetailPage } from "@/features/subscriptions/SubscriptionDetailPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SubscriptionDetailPage id={id} />;
}
