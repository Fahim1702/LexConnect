export const itemId = (value) => value && typeof value === 'object' ? value._id : value;

export function initialForm(fields, item) {
  return Object.fromEntries(fields.map((field) => {
    let value = field.from ? field.from.split('.').reduce((current, key) => current?.[key], item) : item?.[field.name];
    if (field.type === 'select') value = itemId(value);
    if (field.type === 'multiselect') value = (value || []).map(itemId).filter(Boolean);
    if (field.type === 'array') value = (value || []).join(', ');
    if (field.type === 'boolean') value = value ?? field.name.startsWith('isActive');
    return [field.name, value ?? ''];
  }));
}

export function formPayload(fields, form, editing) {
  return Object.fromEntries(fields.filter(field => !(editing && field.createOnly)).map((field) => {
    let value = form[field.name];
    if (field.type === 'select') value = itemId(value);
    if (field.type === 'number') value = value === '' ? 0 : Number(value);
    if (field.type === 'array') value = value.split(',').map(item => item.trim()).filter(Boolean);
    return [field.name, value];
  }));
}
