import { NextResponse } from 'next/server';
export async function GET(){return NextResponse.json({ok:true,service:'ztn-store-marketplace',time:new Date().toISOString()});}
