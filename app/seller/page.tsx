import { SellerScreen } from "@/components/screens";

export default async function Page({ searchParams }: { searchParams: Promise<{ seller?: string }> }){
  const params = await searchParams;
  return <SellerScreen sellerId={params.seller} />;
}
