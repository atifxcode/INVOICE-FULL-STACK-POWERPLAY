import { Schema, model, Document } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  company: string;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { 
        type: String, 
        required: true, 
        unique: true, 
        index: true 
    },
    company: { 
        type: String, 
        required: true, 
        index: true
    },
  },
  { timestamps: true }
);

export default model<ICustomer>("Customer", CustomerSchema);