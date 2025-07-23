import { Button, type ButtonProps } from '@chakra-ui/react';
import { FiFilter } from 'react-icons/fi';

const FilterButton = (props: ButtonProps) => {
    const { onClick } = props;
    return (
        <Button onClick={onClick} variant="outline" rounded="md" size="sm">
            <FiFilter />
        </Button>
    );
};

export default FilterButton;
