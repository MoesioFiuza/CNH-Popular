declare module 'react-window' {
    import { ComponentType, CSSProperties } from 'react';
  
    export interface ListChildComponentProps {
      index: number;
      style: CSSProperties;
      data?: any;
      isScrolling?: boolean;
    }
  
    export interface FixedSizeListProps {
      height: number;
      width: number | string;
      itemCount: number;
      itemSize: number;
      itemData?: any;
      children: ComponentType<ListChildComponentProps>;
      className?: string;
      innerElementType?: React.ElementType;
      outerElementType?: React.ElementType;
      style?: React.CSSProperties;
      useIsScrolling?: boolean;
    }
  
    export class FixedSizeList extends React.Component<FixedSizeListProps> {}
  }
  