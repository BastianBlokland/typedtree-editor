import * as Utils from "./utils";
import * as Tree from "./tree";

export function fieldWithValue<T extends Tree.Field>(
    field: T, element: Tree.FieldElementType<T>, offset: number = 0): T {

    switch (field.kind) {
        case "stringArray":
        case "numberArray":
        case "booleanArray":
        case "nodeArray":
            // Unfortunately the type system cannot follow what we are doing here so some casts are required.
            const arrayField = <Tree.OnlyArrayField<T>>field;
            const newValue = Utils.withNewElement(arrayField.value, offset, <Tree.FieldElementType<Tree.Field>>element);
            return <T>{ ...field, value: newValue };
        default:
            return <T>{ ...field, value: element };
    }
}
