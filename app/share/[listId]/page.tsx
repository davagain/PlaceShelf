import { SharedListView } from "@/components/shared-list-view";

export default function SharePage({ params }: { params: { listId: string } }) {
  return <SharedListView listId={params.listId} />;
}
