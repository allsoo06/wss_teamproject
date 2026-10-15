import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

async function getCol() {
  const client = await clientPromise;
  return client.db("taskmanager").collection("tasks");
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const { index, done } = await req.json();
  const col = await getCol();
  await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { [`subtasks.${index}.done`]: done } },
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  const col = await getCol();
  await col.deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ ok: true });
}
