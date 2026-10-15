import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

async function getCol() {
  const client = await clientPromise;
  return client.db("taskmanager").collection("tasks");
}

export async function GET() {
  const col = await getCol();
  const tasks = await col.find({}).sort({ dueDate: 1 }).toArray();
  return NextResponse.json(tasks.map((t) => ({ ...t, _id: t._id.toString() })));
}

export async function POST(req) {
  const body = await req.json();
  const doc = {
    title: body.title || "제목 없음",
    type: body.type || "개인",
    dueDate: body.dueDate,
    submitMethod: body.submitMethod || "",
    subtasks: (body.subtasks || []).map((s) => ({
      title: s.title,
      dueDate: s.dueDate,
      done: false,
    })),
    createdAt: new Date(),
  };
  const col = await getCol();
  const r = await col.insertOne(doc);
  return NextResponse.json({ ...doc, _id: r.insertedId.toString() });
}
