import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navigation from '../Navigation';
import {
  __resetNavigationMocks,
  __setPathname,
  __setRouter,
  createRouter,
} from '../../../test/__mocks__/nextNavigation';

describe.skip('Navigation', () => {
  beforeEach(() => {
    __resetNavigationMocks();
    __setPathname('/zh');
  });

  it('默认显示中文菜单并可切换至英文', async () => {
    const user = userEvent.setup();
    const router = createRouter();
    __setRouter(router);

    render(<Navigation initialLanguage="zh" />);

    const homeLinks = screen.getAllByRole('link', { name: '首页' });
    expect(homeLinks.length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: '中 / EN' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '中 / EN' }));

    expect(router.push).toHaveBeenCalledWith('/en');
    expect(screen.getByRole('button', { name: 'EN / 中' })).toBeInTheDocument();
  });

  it('根据路径高亮当前菜单项', () => {
    __setPathname('/zh/start');

    render(<Navigation initialLanguage="zh" />);

    const activeLink = screen.getAllByRole('link', { name: '综合测评' })[0];
    const inactiveLink = screen.getAllByRole('link', { name: '首页' })[0];

    expect(activeLink).toHaveAttribute('aria-current', 'page');
    expect(activeLink).toHaveStyle(`border-bottom: 2px solid ${'#8DAE92'}`);
    expect(inactiveLink).not.toHaveAttribute('aria-current');
  });

  it('切换语言时保留当前页路径', async () => {
    const user = userEvent.setup();
    __setPathname('/zh/about');
    const router = createRouter();
    __setRouter(router);

    render(<Navigation initialLanguage="zh" />);

    await user.click(screen.getByRole('button', { name: '中 / EN' }));

    await screen.findByRole('button', { name: 'EN / 中' });
    expect(router.push).toHaveBeenCalledWith('/en/about');
  });
});

