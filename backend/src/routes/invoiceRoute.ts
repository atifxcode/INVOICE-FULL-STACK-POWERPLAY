import { Router } from "express";
import { createInvoice, deleteInvoice, getInvoice, listInvoices, updateInvoice } from "../controllers/invoiceController";
import { create } from "node:domain";


const router = Router();

router.get('/', listInvoices);
router.get('/:id', getInvoice);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

export default router;