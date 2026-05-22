import Transaction from '../models/Transaction.js';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';

export const exportCsv = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ date: -1 });

    const fields = ['title', 'amount', 'type', 'category', 'date', 'note'];
    const opts = { fields };
    
    const parser = new Parser(opts);
    const csv = parser.parse(transactions);

    res.header('Content-Type', 'text/csv');
    res.attachment('transactions.csv');
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const exportPdf = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ date: -1 });

    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.pdf');
    
    doc.pipe(res);

    doc.fontSize(20).text('Transactions Report', { align: 'center' });
    doc.moveDown();

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((t) => {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpense += t.amount;

      doc.fontSize(12).text(`${new Date(t.date).toLocaleDateString()} - ${t.title}`);
      doc.fontSize(10).text(`Type: ${t.type} | Category: ${t.category} | Amount: ₹${t.amount}`);
      if (t.note) doc.fontSize(10).text(`Note: ${t.note}`);
      doc.moveDown(0.5);
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total Income: ₹${totalIncome}`);
    doc.fontSize(14).text(`Total Expense: ₹${totalExpense}`);
    doc.fontSize(14).text(`Net Balance: ₹${totalIncome - totalExpense}`);


    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
