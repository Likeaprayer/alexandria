import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBook extends Document {
  title: string;
  author: string;
  isbn: string;
  publishedYear: number;
  genre: string;
  quantity: number;
  borrowedBy?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}


const BookSchema: Schema = new Schema<IBook>(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Please add an author'],
      trim: true,
    },
    isbn: {
      type: String,
      required: [true, 'Please add an ISBN'],
      unique: true,
      trim: true,
    },
    publishedYear: {
      type: Number,
      required: [true, 'Please add a published year'],
    },
    genre: {
      type: String,
      required: [true, 'Please add a genre'],
    },
    quantity: {
      type: Number,
      required: [true, 'Please add quantity'],
      default: 1,
    },
    borrowedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IBook>('Book', BookSchema);
