import { forwardRef } from 'react';

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

const NextLink = forwardRef<HTMLAnchorElement, AnchorProps>(function NextLink(
  { children, ...props },
  ref,
) {
  return (
    <a ref={ref} {...props}>
      {children}
    </a>
  );
});

export default NextLink;







