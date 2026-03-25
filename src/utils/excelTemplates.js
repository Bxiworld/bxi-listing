import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Template definitions for each category
const TEMPLATES = {
  electronics: {
    filename: 'Electronics_Bulk_Upload_Template.xlsx',
    headers: [
      'Product Name*',
      'Product Description*',
      'Brand',
      'Model Number',
      'Size/Capacity',
      'Color',
      'Price*',
      'Discounted Price',
      'Min Order Quantity*',
      'Max Order Quantity',
      'GST*',
      'HSN Code',
      'Stock Quantity*',
      'Manufacturing Date (YYYY-MM-DD)*',
      'Expiry Date (YYYY-MM-DD)',
      'Warranty Period',
      'Weight (kg)',
      'Dimensions (LxWxH cm)',
      'Material',
      'Power Rating',
      'Feature 1',
      'Feature 2',
      'Feature 3',
      'Tags (comma separated)',
    ],
    sampleData: [
      [
        'Wireless Bluetooth Headphones',
        'Premium noise-cancelling wireless headphones with 30-hour battery life',
        'SoundPro',
        'SP-WH300',
        'Standard',
        'Black',
        '3999',
        '2999',
        '1',
        '100',
        '18',
        '8518',
        '50',
        '2024-01-15',
        '',
        '1 Year',
        '0.25',
        '20 x 18 x 8',
        'Plastic, Foam',
        '5W',
        'Noise Cancellation',
        'Bluetooth 5.0',
        '30-hour Battery',
        'wireless, audio, premium',
      ],
    ],
  },
  
  fmcg: {
    filename: 'FMCG_Bulk_Upload_Template.xlsx',
    headers: [
      'Product Name*',
      'Product Description*',
      'Brand',
      'Product Form (Dry/Wet)*',
      'Size/Volume*',
      'Measurement Unit*',
      'Price*',
      'Discounted Price',
      'Min Order Quantity*',
      'Max Order Quantity',
      'GST*',
      'HSN Code',
      'Stock Quantity*',
      'Manufacturing Date (YYYY-MM-DD)*',
      'Expiry Date (YYYY-MM-DD)*',
      'Weight (kg)',
      'Packaging Type',
      'Ingredients',
      'Nutritional Info',
      'Feature 1',
      'Feature 2',
      'Feature 3',
      'Tags (comma separated)',
    ],
    sampleData: [
      [
        'Organic Green Tea',
        'Premium organic green tea leaves, rich in antioxidants',
        'NatureBliss',
        'Dry',
        '100',
        'grams',
        '299',
        '249',
        '1',
        '50',
        '12',
        '0902',
        '200',
        '2024-06-01',
        '2025-06-01',
        '0.1',
        'Eco-Friendly Box',
        'Green Tea Leaves, Natural Flavors',
        'Antioxidants, Vitamin C',
        'Organic',
        'No Added Sugar',
        'Gluten-Free',
        'organic, tea, health, natural',
      ],
    ],
  },
  
  officesupply: {
    filename: 'OfficeSupply_Bulk_Upload_Template.xlsx',
    headers: [
      'Product Name*',
      'Product Description*',
      'Brand',
      'Product Type',
      'Size/Dimensions',
      'Color',
      'Price*',
      'Discounted Price',
      'Min Order Quantity*',
      'Max Order Quantity',
      'GST*',
      'HSN Code',
      'Stock Quantity*',
      'Manufacturing Date (YYYY-MM-DD)',
      'Weight (kg)',
      'Material',
      'Pack Quantity',
      'Feature 1',
      'Feature 2',
      'Feature 3',
      'Tags (comma separated)',
    ],
    sampleData: [
      [
        'Premium Ball Point Pens',
        'Smooth writing ball point pens, pack of 10',
        'WritePro',
        'Writing Instrument',
        'Standard',
        'Blue',
        '150',
        '120',
        '5',
        '100',
        '18',
        '9608',
        '500',
        '2024-03-10',
        '0.05',
        'Plastic, Metal',
        '10',
        'Smooth Ink Flow',
        'Ergonomic Grip',
        'Long-lasting',
        'pens, office, writing, stationery',
      ],
    ],
  },
  
  restaurant: {
    filename: 'Restaurant_Bulk_Upload_Template.xlsx',
    headers: [
      'Product Name*',
      'Product Description*',
      'Cuisine Type',
      'Dish Category',
      'Serving Size',
      'Price*',
      'Discounted Price',
      'Min Order Quantity*',
      'Max Order Quantity',
      'GST*',
      'HSN Code',
      'Preparation Time (minutes)',
      'Spice Level (Mild/Medium/Hot)',
      'Is Vegetarian',
      'Is Vegan',
      'Contains Allergens',
      'Ingredients',
      'Nutritional Info',
      'Feature 1',
      'Feature 2',
      'Feature 3',
      'Tags (comma separated)',
    ],
    sampleData: [
      [
        'Butter Chicken',
        'Rich and creamy butter chicken with aromatic spices',
        'Indian',
        'Main Course',
        '2 Persons',
        '450',
        '399',
        '1',
        '10',
        '5',
        '210690',
        '30',
        'Medium',
        'No',
        'No',
        'Dairy, Nuts',
        'Chicken, Butter, Cream, Tomatoes, Spices',
        'Calories: 450, Protein: 35g, Fat: 25g',
        'Made with Fresh Ingredients',
        'Authentic Recipe',
        'Chef Special',
        'indian, chicken, curry, butter chicken',
      ],
    ],
  },
};

// Function to download template
export const downloadBulkUploadTemplate = (category) => {
  const template = TEMPLATES[category?.toLowerCase()];
  
  if (!template) {
    console.error(`No template found for category: ${category}`);
    return false;
  }

  try {
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Create worksheet with headers and sample data
    const wsData = [template.headers, ...template.sampleData];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    ws['!cols'] = template.headers.map(() => ({ wch: 20 }));
    
    // Style the header row (first row)
    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      
      // Add bold styling (note: this requires additional libraries for full styling)
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'C64091' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
    }
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    
    // Add instructions sheet
    const instructionsData = [
      ['Bulk Upload Instructions'],
      [''],
      ['Important Notes:'],
      ['1. Fields marked with * are mandatory'],
      ['2. Do not modify the header row'],
      ['3. Dates should be in YYYY-MM-DD format (e.g., 2024-12-31)'],
      ['4. For multiple tags, separate them with commas'],
      ['5. Price should be in INR without currency symbol'],
      ['6. GST should be a number (e.g., 18 for 18%)'],
      ['7. Keep one row as sample data for reference'],
      ['8. Delete the sample data row before uploading'],
      ['9. Maximum 1000 products per upload'],
      ['10. File size should not exceed 10MB'],
      [''],
      ['After filling the template:'],
      ['1. Save the file'],
      ['2. Go to Product Information step'],
      ['3. Click "Upload Excel" button'],
      ['4. Select your filled template'],
      ['5. Review the preview and submit'],
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
    wsInstructions['!cols'] = [{ wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
    
    // Generate Excel file
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    
    // Download file
    saveAs(blob, template.filename);
    
    return true;
  } catch (error) {
    console.error('Error generating template:', error);
    return false;
  }
};

// Function to check if category supports bulk upload
export const supportsBulkUpload = (category) => {
  return ['electronics', 'fmcg', 'officesupply', 'restaurant'].includes(category?.toLowerCase());
};

// Function to get template info
export const getTemplateInfo = (category) => {
  const template = TEMPLATES[category?.toLowerCase()];
  return template ? { filename: template.filename, columns: template.headers.length } : null;
};
